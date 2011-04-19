
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
            url: document.location.protocol+'//twitter.com/users/'+uname+'.json', 
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
        window.location.hash = '!/'+$(this).children('.user-profile-link')
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
    
    //-- Drag and drop --//
    
    // Note: Chrome currently just implements this API incorrectly, so there's
    //       some wonkiness going on with the data we transfer, as well as
    //       the MIME types we use.  Ideally we'd use "tweep" or similar, but
    //       we're forced to use one of "text", "text/plain", etc.  We use
    //       "text/uri-list" because it's relatively obscure, but this is still
    //       inferior.  Also note that as yet another way to prevent bad data
    //       from arriving we're temporarily prefixing all tweep names with
    //       "tweep://", which is then stripped out.
    //       
    //       See Chromium issue 31037.
    
    $('#qtl, #qtl-plus').live('drop', function(e){
        //add our tweep
        var tweep = e.originalEvent.dataTransfer.getData('text/uri-list');
        if (tweep && tweep.substr(0, 8) == 'tweep://')
            add(tweep.substr(8), refreshBar);
        
        $('#qtl').removeClass('qtl-dnd-highlight');
        e.preventDefault();
    }).live('dragenter', function(e){
        //cancel the event if it's what we're looking for
        var dt = e.originalEvent.dataTransfer;
        if (dt.types[0] === 'text/uri-list'){
            e.preventDefault(); 
            $('#qtl').addClass('qtl-dnd-highlight');
        }
        
        return true;
    }).live('dragleave', function(e){
        $('#qtl').removeClass('qtl-dnd-highlight');
    }).live('dragover', function(e){
        $('#qtl').addClass('qtl-dnd-highlight');
        return false;
    });
    
    //periodically poll the page for new avatars to make draggable
    setInterval(function(){
        //small avatars, such as the ones in the "following" or "followers" lists
        $('a > img[width="24"]:not([draggable])').parent()
        .attr('draggable', 'true')
        .bind('dragstart', function(e){
            var dt = e.originalEvent.dataTransfer;
            dt.setData('text/uri-list', 'tweep://' + $(e.target).attr('original-title'));
            return true;
        });
        
        //medium avatars, such as those in the "who to follow" list
        $('a.user-profile-link.user-thumb > img:not([draggable])')
        .attr('draggable', 'true')
        .bind('dragstart', function(e){
            var dt = e.originalEvent.dataTransfer;
            dt.setData('text/uri-list', 'tweep://' + $(e.target).attr('alt'));
            return true;
        });
        
        //tweet avatars
        $('div.tweet-image > img:not([draggable])')
        .attr('draggable', 'true')
        .bind('dragstart', function(e){
            var dt = e.originalEvent.dataTransfer;
            dt.setData('text/uri-list', 'tweep://' + 
                $(e.target).parent().parent().attr('data-screen-name'));
            return true;
        });
        
        //search results
        $('div[data-user-id] > img.user-profile-link:not([draggable])')
        .attr('draggable', 'true')
        .bind('dragstart', function(e){
            var dt = e.originalEvent.dataTransfer;
            dt.setData('text/uri-list', 'tweep://' + $(e.target).attr('alt'));
            return true;
        });
        
        //todo - "who to follow" list users
    }, 200);
});


