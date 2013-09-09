// ==UserScript==
// @name	百度网盘助手
// @author	有一份田
// @description	显示百度网盘文件的直接链接,突破大文件需要使用电脑管家的限制
// @namespace	http://userscripts.org/scripts/show/176807
// @updateURL	https://userscripts.org/scripts/source/176807.meta.js
// @downloadURL	https://userscripts.org/scripts/source/176807.user.js
// @icon	http://duoluohua.com/myapp/script/dupanlink/images/icon_48.png
// @license	GPL version 3
// @encoding	utf-8
// @include     http://pan.baidu.com/*
// @include     http://yun.baidu.com/*
// @run-at	document-end
// @version	2.0.2
// ==/UserScript==

/*
 * === 说明 ===
 *@作者:有一份田
 *@官网:http://duoluohua.com/download/
 *@Email:youyifentian@gmail.com
 *@Git:http://git.oschina.net/youyifentian
 *@转载重用请保留此信息
 *@最后修改时间:2013.09.09
 *
 *
 * */


var version="2.0.2";

(function(){
	var icons=document.getElementsByClassName("icon-download");
	if(!icons.length)return;
	var msg=[
		"\u54b1\u80fd\u4e0d\u4e8c\u4e48\x2E\x2E\x2E",
		"\u5c3c\u739b\u4f60\u4e00\u4e2a\u6587\u4ef6\u90fd\u4e0d\u9009\u4f60\u4e0b\u4e2a\u6bdb\u7ebf\u554a\x2E\x2E\x2E",
		"\u4f60\x54\x4D\u77e5\u9053\u4f60\u9009\u4e86\x31\x30\x30\u591a\u4e2a\u6587\u4ef6\u5417\x3F\u60f3\u7d2f\u6b7b\u6211\u554a\x2E\x2E\x2E",
		"\u8bf7\u7a0d\u540e\uff0c\u8bf7\u6c42\u5df2\u53d1\u9001\uff0c\u670d\u52a1\u5668\u6b63\u5728\u4e3a\u60a8\u51c6\u5907\u6570\u636e\x2E\x2E\x2E",
		"\u60a8\u53ef\u4ee5\u9009\u62e9\u5c06\u8be5\u94fe\u63a5\u590d\u5236\u5230\u4e0b\u8f7d\u5668\u4e2d\u4e0b\u8f7d\n\n\u6216\u8005\u70b9\u51fb\x20\u786e\u5b9a\x20\u7acb\u5373\u5f00\u59cb\u6d4f\u89c8\u5668\u4e0b\u8f7d\n\u53d6\u6d88\u8bf7\u70b9\x20\u5426\n\n"
	],btnArr=[],index=0,downProxy=disk.util.DownloadProxy;

	for(var i=0;i<icons.length;i++){
		var node=icons[i].parentNode;
		if(node.id)btnArr.push(node);
	}
	for(var i=0;i<btnArr.length;i++){
		var item=btnArr[i],o=createDom();
		o.onclick=downManager;
		//item.helper=o;
		item.parentNode.insertBefore(o,item.nextSibling);
	}
	function createDom(){
		var o=document.createElement("A");
		o.href="javascript:void(0);";
		o.className="new-dbtn";
		o.innerHTML='<em class="icon-download"></em><b>\u52a9\u624b\u4e0b\u8f7d</b>';
		return o;
	}
	function downManager(){
		downProxy._warmupHTML();
		var items=[],iframe=document.getElementById("pcsdownloadiframe");
		iframe.src="javascript:;";
		if(disk.util.ViewShareUtils){
			var data=disk.util.ViewShareUtils.viewShareData,obj=JSON.parse(data);
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
		var isOneFile=(len==1 && items[0].isdir==0),isOther=Page.inViewMode(Page.VIEW_PROPERTY_OTHER);
		if(isOther)downloadCounter(items,isOneFile);
		if(isOneFile){
			var url=items[0].dlink, r=prompt(msg[4],url);
			if(r.length>=url.length)iframe.src=url;
		}else{
			downProxy.prototype.setPackName(FileUtils.parseDirFromPath(items[0].path), !items[0].isdir);
			var form = document.forms.pcsdownloadform,action="",data=[],packName=downProxy.prototype._mPackName;
			for (var i = 0; i < len; i++) {
	                    if (isOther) {
	                        data.push(items[i].fs_id);
	                    }else{
	                        data.push({
	                            path: FileUtils.parseDirPath(items[i].path)
	                        });
	                    }
	                }
			if(isOther){
				action = disk.api.RestAPI.MULTI_DOWNLOAD_PUBLIC + "&uk=" + FileUtils.sysUK + downProxy.prototype._resolveExtraInfo();
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
		}
		myAlert(msg[3],1);
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
	function downloadCounter(C, B) {
	        if (Page.inViewMode(Page.VIEW_PROPERTY_OTHER)) {
	            var F = FileUtils.share_uk,
	            D = FileUtils.share_id,
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

})();
function loadJs(js){
	var oHead=document.getElementsByTagName('HEAD')[0],
	    oScript= document.createElement("script"); 
	oScript.type = "text/javascript"; 
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
	js+="_gaq.push(['_trackEvent','dupanlink_script',String(new Date().getTime())]);";
	loadJs(js);
}
googleAnalytics();

