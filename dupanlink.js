// ==UserScript==
// @name	百度网盘直链助手
// @author	有一份田
// @description	显示百度网盘文件的直接链接,其实应该是缓存所以有可能有时间显示,该链接可能会失效
// @namespace	http://userscripts.org/scripts/show/176807
// @updateURL	https://userscripts.org/scripts/source/176807.meta.js
// @downloadURL	https://userscripts.org/scripts/source/176807.user.js
// @icon	http://duoluohua.com/myapp/script/dupanlink/images/icon_48.png
// @license	GPL version 3
// @encoding	utf-8
// @include     http://pan.baidu.com/share/link*
// @include     http://yun.baidu.com/*
// @run-at	document-end
// @version	1.0.1
// ==/UserScript==

/*
 * === 说明 ===
 *@作者:有一份田
 *@官网:http://duoluohua.com/download/
 *@Email:youyifentian@gmail.com
 *@Git:http://git.oschina.net/youyifentian
 *@转载重用请保留此信息
 *@最后修改时间:2013.08.29
 *
 *
 *
 * === 重要声明 ===
 *
 *>>使用该脚本后您可以直接下载分享文件,
 *>>但是该动作不会计入该分享文件的下载量统计,
 *>>而大家都明白一个分享文件的下载量在某种曾度上反应了该文件的受欢迎程度,
 *>>而且较多的下载量也会激励分享者更多更好的分享,
 *>>所以我们希望您在使用本脚本的时候也同时考虑到上述情况,
 *>>合理使用本脚本,特此声明
 *
 * */


var version="1.0.1";

(function(){
	if(!disk.util.ViewShareUtils)return;
	var downloadBtn=document.getElementById("downFileButtom");
	if(!downloadBtn)return;
	var data=disk.util.ViewShareUtils.viewShareData,
	obj=JSON.parse(data),node=document.createElement("a");
	node.href=obj.dlink;
	node.className="new-dbtn";
	node.innerHTML='<em class="icon-download"></em><b><font color="#1E75D8">直链下载</font></b>';
	downloadBtn.parentNode.insertBefore(node,downloadBtn.nextSibling);
	//alert(obj.dlink);
})();



