
$(function(){
    var refreshBar = function(){
        var accts = JSON.parse(localStorage.getItem('qtlAccounts')) || {};
        var bar = $('<div id="qtl"></div>');
        var names = 0;
        for (var uname in accts){
            names++;
            bar.append('<div class="qtl-image">'+
                    '<img class="x" src="'+chrome.extension.getURL('x.png')+'">'+
                    '<img '+
                    'class="user-profile-link" '+
                    'src="'+accts[uname].profile_image_url+'" '+ 
                    'alt="'+accts[uname].name+'" '+
                    'data-user-id="'+accts[uname].id_str+'" '+
                    'data-user-username="'+uname+'"></div>');
        }
        if (names < 10)
            bar.append('<a href="#" id="qtl-plus"><img src="'+
                    chrome.extension.getURL('plus.png')+'"></a>');
        $('#qtl').remove();
        $('#page-container > div > .main-content').prepend(bar);
    };
    
    var add = function(uname, clbk){
        $.ajax({
            url: 'http://twitter.com/users/'+uname+'.json', 
            dataType: 'json',
            success: function(resp){
                var accts = JSON.parse(localStorage.getItem('qtlAccounts')) || {};
                accts[uname] = resp;
                localStorage.setItem('qtlAccounts', JSON.stringify(accts));
                if (clbk) clbk(true);
            },
            error: function(){
                if (clbk) clbk(false);
            },
        });
    };
    
    $('#qtl-plus').live('click', function(e){
        e.preventDefault();
        $(this).after('<form id="qtl-form"> '+
                '<input type="text"> '+
                '<input type="submit" value="Add" class="tweet-button"> '+
                '<input type="button" value="Cancel" class="tweet-button"> '+
                '</form>');
        $('#qtl-form input[type=text]').focus();
    });
    
    $('#qtl-form').live('submit', function(e){
        e.preventDefault();
        add($('#qtl-form input[type=text]').val(), function(worked){
            if (worked){
                $('#qtl-form').remove();
                refreshBar();
            }else{
                console.log('load failed');
                $('#qtl-form input[type=text]').css({backgroundColor: '#ffcaca'});
            }
        });
    });
    
    $('#qtl-form input[type=button]').live('click', function(e){
        e.preventDefault();
        $('#qtl-form').remove();
    });
    
    $('#qtl-form input[type=text]').live('keypress', function(e){
        e.preventDefault();
        if (e.charCode == 13)
            $('#qtl-form').submit();
        else
            $(this).val($(this).val()+String.fromCharCode(e.charCode));
        $('#qtl-form input[type=text]').css({backgroundColor: '#fff'});
    });
    
    $('.qtl-image').live('click', function(e){
        e.preventDefault();
        window.location.hash = '!/'+$(this).children('img')
                .attr('data-user-username');
    });
    
    $('.qtl-image').live('mouseover', function(){
        $(this).children('.x').show();
    });
    $('.qtl-image').live('mouseout', function(){
        $(this).children('.x').hide();
    });
    
    $('.qtl-image .x').live('click', function(e){
        e.stopImmediatePropagation();
        var accts = JSON.parse(localStorage.getItem('qtlAccounts')) || {};
        delete accts[$(this).siblings('img').attr('data-user-username')];
        localStorage.setItem('qtlAccounts', JSON.stringify(accts));
        refreshBar();
    });
    
    (function checkDisplay(){
        setTimeout(function(){
            if ($('#page-container > div > .main-content').length > 0 && 
                    $('#qtl:visible').length == 0)
                refreshBar();
            checkDisplay();
        }, 100);
    })();
});


