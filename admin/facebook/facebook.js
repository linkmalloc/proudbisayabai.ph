window.CustomFB = (() => {
  APP_ID = '423521155390099';

  initFacebook = () => {
    FB.init({
      appId            : APP_ID,
      autoLogAppEvents : true,
      xfbml            : true,
      version          : 'v14.0'
    });
  }

  login = () => {
    FB.login(()=>{
      window.location.reload()
    })
  }

  sub_image = (url, index) => {
    var extension = 'jpg'
    return `<div class="col-lg-3 col-md-4 col-6">
      <a class="download-image d-block mb-4 h-100" data-href="${url}">
        <img class="img-fluid img-thumbnail" src="${url}" alt="">
      </a>
    </div>`
  }

  download_image = (url) => {
    var a = $("<a>")
    .attr("href", `${url}`)
    .attr("download", "img.png")
    .appendTo("body");
    debugger
    a[0].click();

    a.remove();
  }

  create_post = (data) => {
    window.post = data;
    // $('body').html(JSON.stringify(data));  
    $('#message').html(window.post.message)
    $('#full_image').attr('src', window.post.full_picture)
    $('#title').html(window.post.message_tags[0].name)

    sub_attachments = window.post.attachments.data[0].subattachments.data

    for (let index = 0; index < sub_attachments.length; index++) {
      const attachment = sub_attachments[index];
      $('#sub_images').append(sub_image(attachment.media.image.src, index+1))
    }

    $('#view_on_fb').attr('href', window.post.permalink_url)
  }

  $(document).on('click', '.download-image', function(){
    download_image($(this).data('href'))
  })

  checkLoginStatus = () => {
    FB.getLoginStatus(function(response) {
      console.log(response.status)
      if (response.status === 'connected') {
        // The user is logged in and has authenticated your
        // app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed
        // request, and the time the access token 
        // and signed request each expire.
        var uid = response.authResponse.userID;
        var accessToken = response.authResponse.accessToken;
        console.log(uid);
        console.log(accessToken);
        var id = '';
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        var sParameterName;
        var i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
    
            if (sParameterName[0] === 'id') {
                id = sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
        console.log(id);

        if (id) {
          id = "_"+ id;
        }

        var url = '/' + '168661168262893' + id + '?fields=id,message,message_tags,attachments{media,media_type,title,url,subattachments},child_attachments,full_picture,from,place,likes,permalink_url';

        console.log(url)
        FB.api(url, function(data){
          console.log(data)
          create_post(data);
        })

      } else if (response.status === 'not_authorized') {
        // The user hasn't authorized your application.  They
        // must click the Login button, or you must call FB.login
        // in response to a user gesture, to launch a login dialog.
        login()
      } else {
        // The user isn't logged in to Facebook. You can launch a
        // login dialog with a user gesture, but the user may have
        // to log in to Facebook before authorizing your application.
        login()
      }
   });
  }

  return {
    init: () => {
      initFacebook();
      checkLoginStatus();
    }
  }
})();