// ==UserScript==
// @name	百度网盘助手
// @author	有一份田
// @description	显示百度网盘文件的直接链接,突破大文件需要使用电脑管家的限制
// @namespace	http://userscripts.org/scripts/show/176807
// @updateURL	https://userscripts.org/scripts/source/176807.meta.js
// @downloadURL	https://userscripts.org/scripts/source/176807.user.js
// @icon	http://img.duoluohua.com/appimg/script_dupanlink_icon_48.png
// @license	GPL version 3
// @encoding	utf-8
// @date 	26/08/2013
// @modified	18/11/2013
// @include     http://pan.baidu.com/*
// @include     http://yun.baidu.com/*
// @grant       GM_xmlhttpRequest
// @run-at	document-end
// @version	2.3.1
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


var VERSION='2.3.1';
var APPNAME='百度网盘助手';
var t=new Date().getTime();

(function(){
	//window=unsafeWindow;
	//document=unsafeWindow.document;
	$=unsafeWindow.$;
	disk=unsafeWindow.disk;
	FileUtils=unsafeWindow.FileUtils;
	Page=unsafeWindow.Page;
	Utilities=unsafeWindow.Utilities;
	var isShareManagerMode=Page.inViewMode(Page.VIEW_SHARE_PROPERTY_OWN),isOther=Page.inViewMode(Page.VIEW_PROPERTY_OTHER),
	downProxy=disk.util.DownloadProxy,shareData=disk.util.ViewShareUtils || null,httpHwnd=null,index=0,
	msg=[
		'咱能不二么,一个文件都不选你让我咋个办...',//0
		'尼玛一个文件都不选你下个毛线啊...',//1
		'你TM知道你选了100多个文件吗?想累死我啊...',//2
		'请稍后，请求已发送，服务器正在为您准备数据...',//3
		'<b>该页面</b>不支持文件夹和多文件的<font color="red"><b>链接复制</b></font>!',//4
		'<font color="red">请求超时...</font>',//5
		'<font color="red">请求出错了...</font>',//6
		'<font color="red">返回数据无法直视...</font>',//7
		'请输入验证码',//8
		'验证码输入错误,请重新输入',//9
		''
	];
	(function(){
		var o=document.createElement('div'),panHelperBtnArr=$.merge($('.icon-download').parent('a'),$('.icon-btn-download').parent('li'));
		o.id='panHelperMenu';
		o.innerHTML='<div id="panHelperMenuList" style="display:none;position:fixed;float:left;z-index:99999999;"><ul class="pull-down-menu" style="display:block;margin:0px;padding:0px;left:0px;top:0px;list-style:none;"><li><a href="javascript:;" class="fuckfirefox" type="0"><b>直接下载</b></a></li><li><a href="javascript:;" class="fuckfirefox" type="1"><b>复制链接</b></a></li><li style="display:none;"><a href="'+getApiUrl('getnewversion',1)+'" target="_blank"><img id="updateimg" title="有一份田" style="border:none;"/></a></li></ul></div>';
		document.body.appendChild(o);
		for(var i=0;i<panHelperBtnArr.length;i++){
			var item=panHelperBtnArr[i];
			createPanHelperBtn(item);
		}
		function createPanHelperBtn(btn){
			var o=document.createElement('div');
			o.style.display='inline-block';
			o.className='b-list-item haspulldown panHelperBtn';
			o.innerHTML='<a class="icon-btn-download" href="javascript:;" title="'+APPNAME+'">网盘助手</a>';
			btn.parentNode.insertBefore(o,btn.nextSibling);
			return o;
		}
		var helperBtn=$('.panHelperBtn'),helperMenuList=$('#panHelperMenuList'),
		menuFun=function(){
			helperDownload($(this).attr('type'));
			helperMenuList.hide();
		};
		helperMenuList.find('a').css('text-align', 'center');
		helperMenuList.find('a.fuckfirefox')[0].onclick=menuFun;
		helperMenuList.find('a.fuckfirefox')[1].onclick=menuFun;
		//helperBtn[0].onclick=function(){helperDownload(0);helperMenuList.hide();};
		helperBtn.mouseenter(function(){
	    		$(this).addClass('b-img-over');
	    		helperMenuList.children('ul').css('width', $(this).children('a').outerWidth()-3);
	    		helperMenuList.css('top', $(this).offset().top+$(this).height()+parseInt($(this).css('paddingTop'))-$(document).scrollTop());
	    		helperMenuList.css('left', $(this).offset().left+parseInt($(this).css('paddingLeft'))).show();
        	}).mouseleave(function(){
	    		$(this).removeClass('b-img-over');
            		helperMenuList.hide();
        	});
		$(document).scroll(function(){
			helperMenuList.hide();
		});
		helperMenuList.mouseenter(function(){
            		$(this).show();
        	}).mouseleave(function(){
            		$(this).hide();
        	});
		//console.log(panHelperBtnArr.length);
		//console.log(panHelperBtnArr);
	})();
	checkUpdate();
	function helperDownload(type){
		downProxy._warmupHTML();
		var items=[],iframe=$('#pcsdownloadiframe')[0];
		iframe.src='javascript:;';
		if(shareData){
			var data=shareData.viewShareData,obj=JSON.parse(data);
			items.push(obj);
		}else{
			items=FileUtils.getListViewCheckedItems();
		}
		var len=items.length;
		if(!len){
			index=index==1?0:1;
			myAlert(msg[index]);
			return;
		}else if(len>100){
			myAlert(msg[2]);
			return;
		}
		var isOneFile=(len==1 && items[0].isdir==0);
		if(isOneFile){
			var url=items[0].dlink;
			if (isUrl(url)) {
				if(1==type){
					showHelperDialog(iframe,type,items,{"errno":0,"dlink":url});
				}else{
					myAlert(msg[3]);
					iframe.src=url;
				}
			}else{
				getDownloadInfo(iframe,type,items);
			}
		}else{
			if(isOther){
				getDownloadInfo(iframe,type,items);
			}else{
				if(1==type){
					return myAlert(msg[4]);
				}
				var form = document.forms.pcsdownloadform,action='',data=[],packName=getDownloadName(items);
				for (var i = 0; i < len; i++){
					if (isOther) {
						data.push(items[i].fs_id);
					}else{
						data.push({
							path: FileUtils.parseDirPath(items[i].path)
						});
					}
				}
				if(isOther){
					action = disk.api.RestAPI.MULTI_DOWNLOAD_PUBLIC + '&uk=' + FileUtils.sysUK + downProxy.prototype._resolveExtraInfo();
					data=data;
				}else{
					action = disk.api.RestAPI.MULTI_DOWNLOAD;
					data={"list":data};
				}
				data=JSON ? JSON.stringify(data) : $.stringify(data);
				form.action=action;
				form.elements.zipcontent.value = data;
				form.elements.zipname.value = packName;
				form.submit();
				myAlert(msg[3]);
			}
		}
		if(isOther)downloadCounter(items,isOneFile);
	}
	function getDownloadName(items){
		if(items.length>1 || 1==items[0]['isdir']){
			downProxy.prototype.setPackName(FileUtils.parseDirFromPath(items[0]['path']), !items[0]['isdir']);
			return downProxy.prototype._mPackName;
		}else{
			return items[0]['server_filename'];
		}
	}
	function downloadCounter(C, B){//C:items,B:isOneFile
	        if (Page.inViewMode(Page.VIEW_PROPERTY_OTHER)) {
	            var F = FileUtils.share_uk || disk.util.ViewShareUtils.uk,
	            D = FileUtils.share_id,
		    G = shareData ? disk.util.ViewShareUtils.albumId : '',
	            A = [];
	            for (var _ in C) {
	                if (C.hasOwnProperty(_)) {
	                    var E = {
	                        fid: C[_].fs_id,
	                        category: C[_].category
	                    };
	                    A.push(E);
	                }
	            }
		    B && G && $.post(disk.api.RestAPI.PCLOUD_ALBUM_DOWNLOAD_COUNTER, {
			    uk: F,
			    album_id: G,
			    fs_id: C[_].fs_id
		    });
	            $.post(disk.api.RestAPI.MIS_COUNTER, {
	                uk: F,
	                filelist: JSON ? JSON.stringify(A) : $.stringify(A),
	                sid: D,
	                ctime: FileUtils.share_ctime,
	                "public": FileUtils.share_public_type
	            });
	            B && $.get(disk.api.RestAPI.SHARE_COUNTER, {
	                type: 1,
	                shareid: D,
	                uk: F,
	                t: new Date().getTime(),
	                _: Math.random()
	            });  
		}
	}
	function myAlert(msg,type){
		try{
			Utilities.useToast({
				toastMode: disk.ui.Toast.MODE_CAUTION,
				msg: msg,
				sticky: false
			});
		}catch(err){
			if(!type)alert(msg);
		}
	}
	function getDownloadInfo(iframe,type,items,vcode){
		if(!vcode)showHelperDialog(iframe,3,items);
		var url='http://pan.baidu.com/share/download',fidlist=[];
		for(var i=0;i<items.length;i++){
			fidlist.push(items[i]['fs_id']);
		}
		var data='shareid='+FileUtils.share_id+'&uk='+FileUtils.share_uk+'&fid_list=['+fidlist.join(',')+']'+(vcode?vcode:'');
			httpHwnd=GM_xmlhttpRequest({
				method: 'POST',
				url: url,
				data: data,
				headers: {
					"Content-Type": 'application/x-www-form-urlencoded'
				},
				onload: function(response){
					//console.log(items);
					//console.log(data);
					//console.log(response.responseText);
					var html=response.responseText,o=JSON.parse(html),dlink=o.dlink;
					if(0===o.errno){
						dlink=dlink+'&zipname='+encodeURIComponent(getDownloadName(items));
						o.dlink=dlink;
						if(shareData){
							var jsondata=shareData.viewShareData,obj=JSON.parse(jsondata);
							obj.dlink=dlink;
							shareData.viewShareData=JSON.stringify(obj);
							items[0]['dlink']=dlink;
						}else if(1==items.length){
							items[0]['dlink']=dlink;
						}
					}
					showHelperDialog(iframe,type,items,o,vcode);
				},
				onerror: function(response){
					if(iframe){
						myAlert(msg[6]);
					}
				},
				ontimeout: function(response){
					if(iframe){
						myAlert(msg[5]);
					}
				}
			});
	}
	function showHelperDialog(iframe,type,items,opt,vcode){
		var canvas=disk.Context.canvas || new disk.ui.Canvas(),
		dialog=document.helperdialog || createHelperDialog(canvas),isVisible=dialog.isVisible();
		disk.Context.canvas=canvas;
		dialog.iframe=iframe;
		dialog.type=type;
		dialog.items=items;
		if(type<2){
			dialog.loading.style.display='none';
			if(0===opt.errno){
				if(0==type){
					iframe.src=opt.dlink;
					canvas.setVisible(false);
					dialog.setVisible(false);
					myAlert(msg[3]);
					return;
				}
				dialog.showdlink.style.display='';
				dialog.showvcode.style.display='none';
				dialog.sharefilename.innerHTML=getDownloadName(items);
				dialog.sharedlink.value=opt.dlink;
				dialog.dlink=opt.dlink;
				dialog.sharedlink.focus();
			}else{
				dialog.showdlink.style.display='none';
				dialog.showvcode.style.display='';
				dialog.vcode.src=opt.img;
				dialog.vcodesrc=opt.img;
				dialog.vcodevalue=opt.vcode;
				if(vcode){
					dialog.vcodeobj.value='';
					dialog.vcodeerror.innerHTML=msg[9];
				}else{
					dialog.vcodeerror.innerHTML='';
				}
				dialog.vcodeobj.focus();
			}
		}
		if(isVisible){
			dialog.setGravity(disk.ui.Panel.CENTER);
			return;
		}
		canvas.setVisible(true);
		dialog.setVisible(true);
		dialog.setGravity(disk.ui.Panel.CENTER);
	}
	function createHelperDialog(canvas){
		var o= document.createElement('div'),
		html='<div class="dlg-hd b-rlv"><span title="关闭"id="helperdialogclose"class="dlg-cnr dlg-cnr-r"></span><h3>百度网盘助手'+VERSION+'</h3></div><div class="download-mgr-dialog-msg center"id="helperloading">加载中&hellip;</div><div id="showvcode"style="text-align:center;display:none;"><div class="dlg-bd download-verify"style="text-align:center;margin-top:25px;"><div class="verify-body">请输入验证码：<input type="text"maxlength="4"class="input-code vcode"><img width="100"height="30"src=""alt="验证码获取中"class="img-code"><a class="underline"href="javascript:;">换一张</a></div><div class="verify-error"style="text-align:left;margin-left:84px;"></div></div><br><div><div class="alert-dialog-commands clearfix"><a href="javascript:;"class="sbtn okay postvcode"><b>确定</b></a><a href="javascript:;"class="dbtn cancel"><b>关闭</b></a></div></div></div><div id="showdlink"style="text-align:center;display:none;"><div class="dlg-bd download-verify"><div style="height:20px;padding:5px 0px;overflow:hidden;"><b><span id="sharefilename"></span></b></div><input type="text"name="sharedlink"id="sharedlink"class="input-code"maxlength="1024"value=""style="width:500px;border:1px solid #BBD4EF;height:24px;line-height:24px;padding:2px;"></div><br><div><div class="alert-dialog-commands clearfix"><a href="javascript:;"class="sbtn okay postdownload"><b>直接下载</b></a><a href="javascript:;"class="dbtn cancel"><b>关闭</b></a></div></div></div>';
		o.className = "b-panel download-mgr-dialog helperdialog";
		o.innerHTML = html;
		o.style.width='550px';
		o.pane=o;
		document.body.appendChild(o);
		var dialog= new disk.ui.Panel(o),vcode=$(o).find('img')[0],vcodeobj=$(o).find('.vcode')[0],
		    sharedlink=$(o).find('#sharedlink')[0],vcodeerror=$(o).find('.verify-error')[0],
		    dialogClose=function(){
			vcodeobj.value='';
			vcodeerror.innerHTML='';
			vcode.src='';
			canvas.setVisible(false);
			dialog.setVisible(false);
			dialog.showdlink.style.display='none';
			dialog.showvcode.style.display='none';
			dialog.loading.style.display='';
			if(httpHwnd)httpHwnd.abort();
		},postvcode=function(){
			if(httpHwnd)httpHwnd.abort();
			var v=vcodeobj.value,len=v.length,vcodevalue='&input='+v+'&vcode='+dialog.vcodevalue;
			if(!len){
				vcodeerror.innerHTML=msg[8];
				return;
			}else if(len<4){
				vcodeerror.innerHTML=msg[9];
				return;
			}
			vcodeerror.innerHTML='';
			getDownloadInfo(dialog.iframe,dialog.type,dialog.items,vcodevalue);
		};
		dialog._mUI.pane=o;
		dialog.loading=$(o).find('#helperloading')[0];
		dialog.showvcode=$(o).find('#showvcode')[0];
		dialog.showdlink=$(o).find('#showdlink')[0];
		dialog.vcodeobj=vcodeobj;
		dialog.sharedlink=sharedlink;
		dialog.sharefilename=$(o).find('#sharefilename')[0];
		dialog.vcode=vcode;
		dialog.vcodeerror=vcodeerror;
		dialog.vcodesrc='';
		dialog.vcodevalue='';
		$(vcode).siblings('a').click(function(){
			vcode.src=dialog.vcodesrc+'&'+new Date().getTime();
		});
		vcodeobj.onkeydown=function(e){if(e.keyCode==13)postvcode();}
		$(o).find('.postvcode')[0].onclick=postvcode;
		$(o).find('.postdownload').click(function(){
			dialog.iframe.src=dialog.dlink;
			dialogClose();
			myAlert(msg[3]);
		});
		$('#sharedlink').mouseover(function(){this.select()});
		$(window).bind("resize",function(){
			dialog.setGravity(disk.ui.Panel.CENTER);
		});
		$(o).find('#helperdialogclose').click(dialogClose);
		$(o).find('.dbtn').click(dialogClose);
		dialog.setVisible(false);
		document.helperdialog=dialog;
		return dialog;
	}
})();
function isUrl(url){return /^(http|https):\/\/([\w-]+(:[\w-]+)?@)?[\w-]+(\.[\w-]+)+(:[\d]+)?([#\/\?][^\s<>;"\']*)?$/.test(url);}
function checkUpdate(){
	var js='var upinfo=document.getElementById("updateimg");';
	js+='upinfo.src="'+getApiUrl('checkupdate',1)+'";';
	js+='upinfo.onload=function(){';
	js+='upinfo.parentNode.parentNode.style.display="";';
	js+='}';
	loadJs(js);
}
function getApiUrl(action,type){
	return 'http://app.duoluohua.com/update?action='+action+'&system=script&appname=dupanlink&apppot=scriptjs&frompot=dupan&type='+type+'&version='+VERSION+'&t='+t;
}
function loadJs(js){
	var oHead=document.getElementsByTagName('HEAD')[0],
	    oScript= document.createElement('script'); 
	oScript.type = 'text/javascript'; 
	oScript.text =js;
	oHead.appendChild( oScript); 	
}
function googleAnalytics(){
	var js="var _gaq = _gaq || [];";
	js+="_gaq.push(['_setAccount', 'UA-43859764-1']);";
	js+="_gaq.push(['_trackPageview']);";
	js+="function googleAnalytics(){";
	js+="	var ga = document.createElement('script');ga.type = 'text/javascript';";
	js+="	ga.async = true;ga.src = 'https://ssl.google-analytics.com/ga.js';";
	js+="	var s = document.getElementsByTagName('script')[0];";
	js+="	s.parentNode.insertBefore(ga, s)";
	js+="}";
	js+="googleAnalytics();";
	js+="_gaq.push(['_trackEvent','dupanlink_script',String('"+VERSION+"')]);";
	loadJs(js);
}
googleAnalytics();









