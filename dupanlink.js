// ==UserScript==
// @name        百度网盘助手
// @author      有一份田
// @description 显示百度网盘文件的直接链接,突破大文件需要使用电脑管家的限制
// @namespace   http://userscripts.org/scripts/show/176807
// @updateURL   https://userscripts.org/scripts/source/176807.meta.js
// @downloadURL https://userscripts.org/scripts/source/176807.user.js
// @icon        http://img.duoluohua.com/appimg/script_dupanlink_icon_48.png
// @license     GPL version 3
// @encoding    utf-8
// @date        26/08/2013
// @modified    06/12/2013
// @include     http://pan.baidu.com/*
// @include     http://yun.baidu.com/*
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @version     2.3.7
// ==/UserScript==



/*
 * === 说明 ===
 *@作者:有一份田
 *@官网:http://www.duoluohua.com/download/
 *@Email:youyifentian@gmail.com
 *@Git:http://git.oschina.net/youyifentian
 *@转载重用请保留此信息
 *
 *
 * */





var VERSION = '2.3.7';
var APPNAME = '百度网盘助手';
var t = new Date().getTime();

(function() {
    //window=unsafeWindow;
    //document=unsafeWindow.document;
    $ = unsafeWindow.$;
    disk = unsafeWindow.disk;
    FileUtils = unsafeWindow.FileUtils;
    Page = unsafeWindow.Page;
    Utilities = unsafeWindow.Utilities;
    var isShareManagerMode = Page.inViewMode(Page.VIEW_SHARE_PROPERTY_OWN),
    isOther = Page.inViewMode(Page.VIEW_PROPERTY_OTHER),downProxy = disk.util.DownloadProxy,
    shareData = disk.util.ViewShareUtils || null,iframe = '',httpHwnd = null,index = 0,
    msg = [
        '咱能不二么,一个文件都不选你让我咋个办...', //0
        '尼玛一个文件都不选你下个毛线啊...', //1
        '你TM知道你选了<b>100</b>多个文件吗?想累死我啊...', //2
        '<b>请求已发送</b>，服务器正在为您准备数据...', //3
        '<b>该页面</b>不支持文件夹和多文件的<font color="red"><b>链接复制和查看</b></font>！', //4
        '<font color="red">请求超时了...</font>', //5
        '<font color="red">请求出错了...</font>', //6
        '<font color="red">返回数据无法直视...</font>', //7
        '请输入验证码', //8
        '验证码输入错误,请重新输入', //9
        '<b>链接已复制到剪切板！</b>', //10
        '未知错误，errno:',//11
        ''
        ],
    helperMenuBtns=(function() {
        var panHelperBtnArr = $.merge($('.icon-download').parent('a'), $('.icon-btn-download').parent('li')),
        menuTitleArr=['直接下载','复制链接','查看链接'],html='';
        html+='<div id="panHelperMenu" style="display:none;position:fixed;float:left;z-index:999999;"><ul class="pull-down-menu" style="display:block;margin:0px;padding:0px;left:0px;top:0px;list-style:none;">';
        for(var i=0;i<menuTitleArr.length;i++){
            html+='<li><a href="javascript:;" class="panHelperMenuList" type="'+i+'"><b>'+menuTitleArr[i]+'</b></a></li>';
        }
        html+='<li style="display:none;"><a href="' + getApiUrl('getnewversion', 1) + '" target="_blank"><img id="updateimg" title="有一份田" style="border:none;"/></a></li></ul></div>';
        $('<div>').html(html).appendTo(document.body);
        for (var i = 0; i < panHelperBtnArr.length; i++) {
            var item = panHelperBtnArr[i];
            createPanHelperBtn(item);
        }
        function createPanHelperBtn(btn) {
            var o=$('<div class="b-list-item haspulldown panHelperBtn" style="display:inline-block;">').html('<em style="height:10px;width:10px;background:url(&quot;/res/static/images/btn_icon.gif&quot;) no-repeat scroll -45px -120px transparent; display:inline-block;position:absolute;margin-left:82px;margin-top:12px;"></em><a class="icon-btn-download" style="width:63px;padding-left:34px;padding-right:0px;" href="javascript:;" title="' + APPNAME + '">网盘助手</a>')[0];
            btn.parentNode.insertBefore(o, btn.nextSibling);
            return o;
        }
        var helperBtn = $('.panHelperBtn'),helperMenu = $('#panHelperMenu'),helperMenuBtns=helperMenu.find('a.panHelperMenuList'),
        menuFun = function() {
            helperDownload($(this).attr('type') || 0);
            helperMenu.hide();
        };
        helperMenu.find('a').css('text-align', 'center');
        helperMenuBtns.click(menuFun);
        //helperBtn.click(menuFun);
        helperBtn.mouseenter(function() {
            $(this).addClass('b-img-over');
            helperMenu.children('ul').css('width', $(this).children('a').outerWidth() - 3);
            helperMenu.css('top', $(this).offset().top + $(this).height() + parseInt($(this).css('paddingTop')) - $(document).scrollTop());
            helperMenu.css('left', $(this).offset().left + parseInt($(this).css('paddingLeft'))).show();
        }).mouseleave(function() {
            $(this).removeClass('b-img-over');
            helperMenu.hide();
        });
        $(document).scroll(function() {
            helperMenu.hide();
        });
        helperMenu.mouseenter(function() {
            $(this).show();
        }).mouseleave(function() {
            $(this).hide();
        });
        return helperMenuBtns;
    })();
    checkUpdate();
    function helperDownload(type) {
        if(!iframe) {
            downProxy._warmupHTML();
            iframe = $('#pcsdownloadiframe')[0]
        }
        var items = [];
        iframe.src = 'javascript:;';
        if(shareData) {
            items.push(JSON.parse(shareData.viewShareData));
        } else {
            items = FileUtils.getListViewCheckedItems();
        }
        var len = items.length;
        if(!len) {
            index = 1 == index ? 0 : 1;
            return myAlert(msg[index]);
        }else if (len > 100) {
            return myAlert(msg[2]);
        }
        var isOneFile = 1 == len && (isOther ? true: 0 == items[0].isdir);
        if(isOneFile) {
            var url = items[0].dlink;
            if(isUrl(url)) {
                if(2 == type) {
                    showHelperDialog(type, items, {"errno": 0,"dlink": url});
                }else if(1 == type){
                    copyText(url);
                } else {
                    myAlert(msg[3],1);
                    iframe.src = url;
                }
            }else{
                getDownloadInfo(type, items);
            }
        }else {
            if(isOther) {
                getDownloadInfo(type, items);
            }else{
                if (0 != type) {
                    return myAlert(msg[4]);
                }
                var form = document.forms.pcsdownloadform,action = '',data = [],packName = getDownloadName(items);
                for (var i = 0; i < len; i++) {
                    var item=items[i];
                    data.push({
                        isdir: item.isdir,
                        path: FileUtils.parseDirPath(item.path),
                        size: item.size
                    });
                }
                action = disk.api.RestAPI.MULTI_DOWNLOAD;
                data = {"list": data};
                data = JSON.stringify(data);
                form.action = action;
                form.elements.zipcontent.value = data;
                form.elements.zipname.value = packName;
                form.submit();
                myAlert(msg[3],1);
            }
        }
        downloadCounter(items);
    }
    function downloadCounter(C) { //C:items,B:isOneFile
        if (!isOther) {return;}
        var F = FileUtils.share_uk || disk.util.ViewShareUtils.uk,
        D = FileUtils.share_id,A = [],B = (1 == C.length && 0 == C[0].isdir),
        G = shareData ? disk.util.ViewShareUtils.albumId: '';
        for (var _ in C) {
            if (C.hasOwnProperty(_)) {
                var E = {
                    fid: C[_].fs_id,
                    category: C[_].category
                };
                A.push(E);
            }
        }
        G && B && $.post(disk.api.RestAPI.PCLOUD_ALBUM_DOWNLOAD_COUNTER, {
            uk: F,
            album_id: G,
            fs_id: C[_].fs_id
        });
        !G && $.post(disk.api.RestAPI.MIS_COUNTER, {
            uk: F,
            filelist: JSON.stringify(A),
            sid: D,
            ctime: FileUtils.share_ctime,
            "public": FileUtils.share_public_type
        });
        !G && B && $.get(disk.api.RestAPI.SHARE_COUNTER, {
            type: 1,
            shareid: D,
            uk: F,
            t: new Date().getTime(),
            _: Math.random()
        });
    }
    function myAlert(msg, type) {
        try {
            var o=Utilities.useToast({
                toastMode: type ? disk.ui.Toast.MODE_SUCCESS : disk.ui.Toast.MODE_CAUTION,
                msg: msg,
                sticky: false,
                position: disk.ui.Panel.TOP
            });
            $(o._mUI.pane).css({"z-index":999999});
        } catch(err) {
            if (!type) alert(msg);
        }
    }
    function copyText(text){
        GM_setClipboard(text);
        myAlert(msg[10],1);
    }
    function getDownloadName(items) {
        if (items.length > 1 || 1 == items[0]['isdir']) {
            downProxy.prototype.setPackName(FileUtils.parseDirFromPath(items[0]['path']), !items[0]['isdir']);
            return downProxy.prototype._mPackName;
        }
        return items[0]['server_filename'];
    }
    function getDownloadInfo(type, items, vcode) {
        if(!vcode) {showHelperDialog(helperMenuBtns.length+1, items);}
        var url = '',data = '',fidlist = '',fids = [];
        for (var i = 0; i < items.length; i++) {
            fids.push(items[i]['fs_id']);
        }
        fidlist = '[' + fids.join(',') + ']';
        url = disk.api.RestAPI.SHARE_GET_DLINK + '&uk=' + FileUtils.share_uk + '&shareid=' + FileUtils.share_id + '&timestamp=' + FileUtils.share_timestamp + '&sign=' + FileUtils.share_sign + '&fid_list=' + fidlist;
        data = 'shareid=' + FileUtils.share_id + '&uk=' + FileUtils.share_uk + '&fid_list=' + fidlist + (vcode ? vcode: '');
        httpHwnd = $.post(url, data,
                function(o) {
                    var dlink = o.dlink;
                    if (0 === o.errno) {
                        dlink = dlink + '&zipname=' + encodeURIComponent(getDownloadName(items));
                        o.dlink = dlink;
                        if (shareData) {
                            var obj = JSON.parse(shareData.viewShareData);
                            obj.dlink = dlink;
                            shareData.viewShareData = JSON.stringify(obj);
                        }
                        if (1 == items.length) {
                            items[0]['dlink'] = dlink;
                        }
                    }
                    showHelperDialog(type, items, o, vcode);
                });
    }
    function showHelperDialog(type, items, opt, vcode) {
        var canvas = disk.Context.canvas || new disk.ui.Canvas(),
        _ = document.helperdialog || createHelperDialog(),isVisible = _.isVisible(),status=0;
        disk.Context.canvas = canvas;
        _.canvas = canvas;
        _.type = type;
        _.items = items;
        if (type < helperMenuBtns.length) {
            if (0 === opt.errno) {
                status=1;
                if(type < 2) {
                    _.canvas.setVisible(false);
                    _.setVisible(false);
                    if(0 == type){
                        iframe.src = opt.dlink;
                        myAlert(msg[3],1);
                    } else {
                        copyText(opt.dlink);
                    }
                    return;
                }
                _.sharefilename.innerHTML = getDownloadName(items);
                _.sharedlink.value = opt.dlink;
                _.dlink = opt.dlink;
                _.downloadbtn.href= opt.dlink;
                _.focusobj = _.sharedlink;
            } else if(-19 ==opt.errno) {
                status=2;
                _.vcodeimg.src = opt.img;
                _.vcodeimgsrc = opt.img;
                _.vcodevalue = opt.vcode;
                _.vcodetip.innerHTML = vcode ? msg[9] : '';
                _.vcodeinput.value = '';
                _.focusobj = _.vcodeinput;
            } else {
                _.canvas.setVisible(false);
                _.setVisible(false);
                return myAlert(disk.util.shareErrorMessage[opt.errno] || (msg[11] + opt.errno));
            }
        }
        _.loading.style.display = 0==status ? '' : 'none';
        _.showdlink.style.display = 1==status ? '' : 'none';
        _.showvcode.style.display = 2==status ? '' : 'none';
        _.copytext.style.display = 1==status ? '' : 'none';
        if (!isVisible) {
            _.canvas.setVisible(true);
            _.setVisible(true);
        }
        _.setGravity(disk.ui.Panel.CENTER);
        _.focusobj.focus();
    }
    function createHelperDialog() {
        var html = '<div class="dlg-hd b-rlv"title="有一份田"><span title="关闭"id="helperdialogclose"class="dlg-cnr dlg-cnr-r"></span><h3><a href="'+getApiUrl('getnewversion',1)+'"target="_blank"style="color:#000;">'+APPNAME+'&nbsp;' + VERSION + '</a><a href="javascript:;"title="点此复制"id="copytext"style="float:right;margin-right:240px;display:none;">点此复制</a></h3></div><div class="download-mgr-dialog-msg center"id="helperloading"><b>数据赶来中...</b></div><div id="showvcode"style="text-align:center;display:none;"><div class="dlg-bd download-verify"style="text-align:center;margin-top:25px;"><div class="verify-body">请输入验证码：<input type="text"maxlength="4"class="input-code vcode"><img width="100"height="30"src=""alt="验证码获取中"class="img-code"><a class="underline"href="javascript:;">换一张</a></div><div class="verify-error"style="text-align:left;margin-left:84px;"></div></div><br><div><div class="alert-dialog-commands clearfix"><a href="javascript:;"class="sbtn okay postvcode"><b>确定</b></a><a href="javascript:;"class="dbtn cancel"><b>关闭</b></a></div></div></div><div id="showdlink"style="text-align:center;display:none;"><div class="dlg-bd download-verify"><div style="padding:5px 0px;"><b><span id="sharefilename"></span></b></div><input type="text"name="sharedlink"id="sharedlink"class="input-code"maxlength="1024"value=""style="width:500px;border:1px solid #7FADDC;padding:3px;height:24px;"></div><br><div><div class="alert-dialog-commands clearfix"><a href="javascript:;"class="sbtn okay postdownload"><b>直接下载</b></a><a href="javascript:;"class="dbtn cancel"><b>关闭</b></a></div></div></div>',
        o=$('<div class="b-panel download-mgr-dialog helperdialog" style="width:550px;">').html(html).appendTo(document.body);
        o[0].pane = o[0];
        var _ = new disk.ui.Panel(o[0]),vcodeimg = o.find('img')[0],vcodeinput = o.find('.vcode')[0],
        sharedlink = o.find('#sharedlink')[0],vcodetip = o.find('.verify-error')[0],
        copytext= o.find('#copytext')[0],postdownloadBtn=o.find('.postdownload')[0],
        dialogClose = function() {
            vcodeinput.value = '';
            vcodetip.innerHTML = '';
            vcodeimg.src = '';
            _.canvas.setVisible(false);
            _.setVisible(false);
            if (httpHwnd) {httpHwnd.abort();}
        },
        postvcode = function() {
            if (httpHwnd) {httpHwnd.abort();}
            var v = vcodeinput.value,len = v.length,max = msg.length - 1,i = max,
            vcode = '&input=' + v + '&vcode=' + _.vcodevalue;
            i = 0 == len ? 8 : (len < 4 ? 9 : i);
            vcodetip.innerHTML = msg[i];
            if (i != max) {return vcodeinput.focus();}
            getDownloadInfo(_.type, _.items, vcode);
        },
        postdownload = function(e) {
            if(!e){iframe.src = _.dlink;}
            dialogClose();
            myAlert(msg[3],1);
        };
        _._mUI.pane = o[0];
        _.loading = o.find('#helperloading')[0];
        _.showvcode = o.find('#showvcode')[0];
        _.showdlink = o.find('#showdlink')[0];
        _.copytext= copytext;
        _.downloadbtn=postdownloadBtn;
        _.vcodeinput = vcodeinput;
        _.sharedlink = sharedlink;
        _.sharefilename = o.find('#sharefilename')[0];
        _.vcodeimg = vcodeimg;
        _.vcodetip = vcodetip;
        _.vcodeimgsrc = '';
        _.vcodevalue = '';
        _.focusobj = sharedlink;
        $(copytext).click(function(){
            copyText(_.dlink);
            this.blur();
        });
        $(vcodeimg).siblings('a').click(function() {
            vcodeimg.src = _.vcodeimgsrc + '&' + new Date().getTime();
        });
        vcodeinput.onkeydown = function(e) {
            if (13 == e.keyCode) {postvcode();}
        };
        o.find('.postvcode').click(postvcode);
        $(postdownloadBtn).click(postdownload);
        $('#sharedlink').focusin(function() {
            this.style.boxShadow = '0 0 3px #7FADDC';
            this.select();
        }).focusout(function() {
            this.style.boxShadow = '';
        }).mouseover(function() {
            this.select();
            this.focus();
        }).keydown(function(e) {
            if (13 == e.keyCode) {postdownload();}
        });
        $(window).bind("resize",
                function() {
                    _.setGravity(disk.ui.Panel.CENTER);
        });
        o.find('#helperdialogclose').click(dialogClose);
        o.find('.dbtn').click(dialogClose);
        _.setVisible(false);
        document.helperdialog = _;
        return _;
    }
})();
function isUrl(url) {
    return /^(http|https):\/\/([\w-]+(:[\w-]+)?@)?[\w-]+(\.[\w-]+)+(:[\d]+)?([#\/\?][^\s<>;"\']*)?$/.test(url);
}
function checkUpdate() {
    var js = 'var upinfo=document.getElementById("updateimg");';
    js += 'upinfo.src="' + getApiUrl('checkupdate', 1) + '";';
    js += 'upinfo.onload=function(){';
    js += 'upinfo.parentNode.parentNode.style.display="";';
    js += '}';
    loadJs(js);
}
function getApiUrl(action, type) {
    return 'http://app.duoluohua.com/update?action=' + action + '&system=script&appname=dupanlink&apppot=scriptjs&frompot=dupan&type=' + type + '&version=' + VERSION + '&t=' + t;
}
function loadJs(js) {
    var oHead = document.getElementsByTagName('HEAD')[0],
    oScript = document.createElement('script');
    oScript.type = 'text/javascript';
    oScript.text = js;
    oHead.appendChild(oScript);
}
function googleAnalytics() {
    var js = "var _gaq = _gaq || [];";
    js += "_gaq.push(['_setAccount', 'UA-43859764-1']);";
    js += "_gaq.push(['_trackPageview']);";
    js += "function googleAnalytics(){";
    js += "	var ga = document.createElement('script');ga.type = 'text/javascript';";
    js += "	ga.async = true;ga.src = 'https://ssl.google-analytics.com/ga.js';";
    js += "	var s = document.getElementsByTagName('script')[0];";
    js += "	s.parentNode.insertBefore(ga, s)";
    js += "}";
    js += "googleAnalytics();";
    js += "_gaq.push(['_trackEvent','dupanlink_script',String('" + VERSION + "')]);";
    loadJs(js);
}
googleAnalytics();





