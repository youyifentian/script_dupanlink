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
// @modified	08/11/2013
// @include     http://pan.baidu.com/*
// @include     http://yun.baidu.com/*
// @grant       GM_xmlhttpRequest
// @run-at	document-end
// @version	2.1.1
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


var VERSION='2.1.1';
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
	var isShareManagerMode=Page.inViewMode(Page.VIEW_SHARE_PROPERTY_OWN),
	downProxy=disk.util.DownloadProxy,index=0,
	btnArr=(function(){
		var node=document.createElement('div');
		node.id='helpermenubox';
		node.innerHTML='<div id="helpermenulist" style="display:none;position:fixed;float:left;z-index:99999999;"><ul class="pull-down-menu" style="display:block;margin:0px;padding:0px;left:0px;top:0px;list-style:none;"><li><a href="javascript:;" class="fuckfirefox" type="0"><b>直接下载</b></a></li><li><a href="javascript:;" class="fuckfirefox" type="1"><b>复制链接</b></a></li><li><a href="javascript:;" type="2" class="killfirefox"><b>生成外链</b></a></li><li style="display:none;"><a href="'+getApiUrl('getnewversion',1)+'" target="_blank"><img id="updateimg" title="\u6709\u4e00\u4efd\u7530" style="border:none;"/></a></li></ul></div>';
		document.body.appendChild(node);
		return $.merge($(isShareManagerMode ? '.icon-share-cancle' : '.icon-download').parent('a'),$('.icon-btn-download').parent('li'));
	})(),hostconfig=null,tipHwnd='',queryLinkHwnd='',
	    linkCache={
	    	"total":0,
		"index":0,
		"pageindex":1,
		"limit":3,
		"msg":"",
		"hostindex":0,
		"sharelink":"",
		"ad":"",
		"linklist":[]
	    },
	    msg=[
		'咱能不二么,一个文件都不选你让我咋个办...',//0
		'尼玛一个文件都不选你下个毛线啊...',//1
		'你TM知道你选了100多个文件吗?想累死我啊...',//2
		'请稍后，请求已发送，服务器正在为您准备数据...',//3
		'您可以选择将该链接复制到下载器中下载\n\n或者点击 确定 立即开始浏览器下载\n取消请点 否\n\n',//4
		'<font color="red"><b>复制链接</b></font> 功能只支持单文件,不支持<b>文件夹和多文件</b>!',//5
		'加载中&hellip;',//6
		'请求超时,请&nbsp;<a href="javascript:;" id="retryqueryhost">点此</a>&nbsp;重试',//7
		'请求出错了,您可以&nbsp;<a href="javascript:;" id="retryqueryhost">点此</a>&nbsp;重试',//8
		'返回数据无法直视,请&nbsp;<a href="javascript:;" id="retryqueryhost">点此</a>&nbsp;重试',//9
		'抱歉,该页面无法执行该操作...',//10
		'分享链接有误,请核对后再试...',//11
		'正在请求数据,请稍后...',//12
		'外链已成功生成',//13
		'<font color="red">返回结果无法直视...</font>',//14
		'<font color="red">外链请求出错,请稍后重试...</font>',//15
		'<font color="red">请求超时,请稍后重试...</font>',//16
		'请求信息已发出,请耐心等待一下下...',//17
		'正在请求数据,暂无法完成该操作...',//18
		'地址已填写,请点击---->',//19
		'至少选择一个分享文件或文件夹',//20
		'该分享链接已失效或审核中...',//21
		'您选中了多个分享,默认只获取第一个...',//22
		'您选中的分享为非公开分享...',//23
		'分享的文件已被删除',//24
		'请先输入分享链接',//25
		'请先选择外链服务器',//26
		'请求已暂停,您可以尝试其他操作...',//27
		'<b>生成外链</b>',//28
		'<b>暂停请求</b>',//29
		''
	];
	queryHost();
	checkUpdate();
	for(var i=0;i<btnArr.length;i++){
		var item=btnArr[i],o=createHelperMenuBtnElement(item);
	}
	function createHelperMenuBtnElement(btn){
		var o=document.createElement('div');
		o.style.display='inline-block';
		o.className='b-list-item b-rlv haspulldown helpermenubtn';
		o.innerHTML='<a class="icon-btn-download" href="javascript:;" title="'+APPNAME+'">网盘助手</a>';
		btn.parentNode.insertBefore(o,btn.nextSibling);
		return o;
	}
	var helperMenuBtn=$('.helpermenubtn'),helperMenuList=$('#helpermenulist'),
	    menuFun=function(){
		    downManager($(this).attr('type'));
		    helperMenuList.hide();
	    };
	helperMenuList.find('a').css('text-align', 'center');
	//firefox---->GM_xmlhttpRequest--->start
	helperMenuList.find('a.fuckfirefox').click(menuFun);
	helperMenuList.find('a.killfirefox')[0].onclick=menuFun;
	//firefox---->GM_xmlhttpRequest--->end
	helperMenuBtn.mouseenter(function(){
	    $(this).addClass('b-img-over');
	    helperMenuList.children('ul').css('width', $(this).children('a').outerWidth()-3);
	    helperMenuList.css('top', $(this).offset().top+$(this).height()+parseInt($(this).css('paddingTop'))+parseInt($(this).css('marginTop'))-$(document).scrollTop());
	    helperMenuList.css('left', $(this).offset().left+parseInt($(this).css('paddingLeft'))+parseInt($(this).css('marginLeft'))).show();
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
	function downManager(type){
		if(2==type){
			return makeOpenLinks();
		}
		if(isShareManagerMode){
			myAlert(msg[10]);
			return;
		}
		downProxy._warmupHTML();
		var items=[],iframe=$('#pcsdownloadiframe')[0];
		iframe.src='javascript:;';
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
		var isOneFile=(len==1 && items[0].isdir==0),isOther=Page.inViewMode(Page.VIEW_PROPERTY_OTHER),r=null;
		if(isOneFile){
			var url=items[0].dlink;
			if(1==type){
				var r=prompt(msg[4],url) || '';
				if(r.length>=url.length)iframe.src=url;
			}else{
				iframe.src=url;
			}
		}else{
			if(1==type){
				return myAlert(msg[5]);
			}
			downProxy.prototype.setPackName(FileUtils.parseDirFromPath(items[0].path), !items[0].isdir);
			var form = document.forms.pcsdownloadform,action='',data=[],packName=downProxy.prototype._mPackName;
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
		}
		if(isOther)downloadCounter(items,isOneFile);
		if(0==type || r)myAlert(msg[3],1);
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
	function makeOpenLinks(){
		var canvas=disk.Context.canvas || new disk.ui.Canvas(),dialog=document.linkdialog || createDialogElement(canvas);
		disk.Context.canvas=canvas;
		document.linkdialog=dialog;
		if(dialog.isVisible())return;
		//alert(dialog._mUI.pane);
		setHostSelect(dialog);
		//queryHost(dialog);
		if(!isShareManagerMode)canvas.setVisible(true);
		dialog.setVisible(true);
		setDialogCenter(dialog);
		dialog.sharelinkbox.focus();
	}
	function createDialogElement(canvas){
		var o= document.createElement('div'),html='';
		html+='<div class="dlg-hd b-rlv"><span title="关闭"id="openlinkdialogclose"class="dlg-cnr dlg-cnr-r"></span><h3>生成外链</h3></div><div class="download-mgr-dialog-msg center"id="openlinkloading">加载中&hellip;</div><div id="openlinkbox"style="display:none;"><div class="dlg-bd clearfix"><div><div style="padding:10px;font-size:12px;"><dt style="padding:5px 10px 3px 0;"><b>外链服务器：</b><span style="float:right;margin-top:-5px;"><a href="'+getApiUrl('sharelinkhost')+'"target="_blank"style="text-decoration:underline;">添加外链服务器</a></span></dt><div class="clearfix"><select style="font-size:19px;width:200px;border:1px solid #BBD4EF;"name="openlinkhost"id="openlinkhost"></select><span>&nbsp;&nbsp;&nbsp;&nbsp;直接访问:&nbsp;&nbsp;<a href="javascript:;"target="_blank"style="text-decoration:underline;">点此</a></span></div><dt style="padding:5px 10px 3px 0;"><b>文件分享链接：</b><span>&nbsp;&nbsp;<a href="javascript:;"id="getlocallink"style="text-decoration:underline;">使用当前地址</a></span><span style="float:right;"><a href="javascript:;"id="clearsharelink"style="text-decoration:underline;"title="清空所有">清空</a>&nbsp;&nbsp;&nbsp;&nbsp;</span></dt><div class="clearfix"><input type="text"name="sharelinkbox"id="sharelinkbox"maxlength="1024"style="width:540px;border:1px solid #BBD4EF;height:24px;line-height:24px;padding:2px;"></div></div><div id="openlinkresult"></div></div></div><br><div class="dlg-ft b-rlv"><div class="clearfix right"><span style="margin-top:13px;margin-right:5px;color:green;"id="openlinktipmsg"></span><a href="javascript:;"class="sbtn okay"><b>生成外链</b></a><a href="javascript:;"class="dbtn cancel"><b>关闭</b></a></div></div></div>';
		o.className = "b-panel b-dialog download-mgr-dialog download-mgr-dialog-m0 helperopenlink";
		o.innerHTML = html;
		o.pane=o;
		document.body.appendChild(o);
		var dialog= new disk.ui.Panel(o),linkloading=$(o).find('#openlinkloading')[0],
		    linkbox=$(o).find('#openlinkbox')[0],hostSelect=$(o).find('#openlinkhost')[0],
		    openhost=$(o).find('#openlinkhost').siblings('span').find('a')[0],locallink=$('#getlocallink')[0],
		    sharelinkbox=$(o).find('#sharelinkbox')[0],linkresult=$(o).find('#openlinkresult')[0],startQueryBtn=$(o).find('.sbtn')[0],
		    dialogClose=function(){
			if(!isShareManagerMode)canvas.setVisible(false);
			dialog.setVisible(false);
		};
		dialog._mUI.pane=o;
		hostSelect.openhost=openhost;
		dialog.linkload=linkloading;
		dialog.linkbox=linkbox;
		dialog.hostselect=hostSelect;
		dialog.sharelinkbox=sharelinkbox;
		dialog.linkresult=linkresult;
		dialog.startBtn=startQueryBtn;
		dialog.isload=false;
		dialog.isQueryLink=false;
		locallink.style.display=/^(http|https):\/\/pan.baidu.com\/disk*\/home*\/*$/.test(location.href) ? 'none' : '';
		$('#getlocallink').click(function(){
			getLocalLink(dialog);
		});
		$('#clearsharelink').click(function(){
			if(dialog.isQueryLink){
				myAlert(msg[18]);
				return;
			}
			sharelinkbox.value='';
			linkresult.innerHTML='';
			showTipMsg('');
			setDialogCenter(dialog);
		});
		sharelinkbox.onmouseover=function(){this.select()};
		$(window).bind("resize",function(){
			setDialogCenter(dialog);
		});
		$(o).find('#openlinkdialogclose').click(dialogClose);
		$(o).find('.dbtn').click(dialogClose);
		startQueryBtn.onclick=function(){
			startQueryLink(dialog);
		};
		return dialog;
	}
	function setHostSelect(dialog){
		if(hostconfig){
			if(!dialog || dialog.isload)return;
			var status=hostconfig.status,msgtext=hostconfig.msg,hostlist=hostconfig.hostlist,
			html='',hostselect=dialog.hostselect,openhost=hostselect.openhost;
			if(0===status){
				for(var i=0;i<hostlist.length;i++){
					var hostItem=hostlist[i];
					html+='<option '+(i==0 ? 'selected="selected"' : '')+'value="'+hostItem.key+'" title="'+hostItem.title+'">'+hostItem.showname+'</option>'; 
				}
				hostItem=hostlist[0];
				hostselect.innerHTML=html;
				openhost.href=hostItem.showurl;
				openhost.title=hostItem.showurl;
				openhost.innerHTML='点此('+hostItem.title+')';
				hostselect.onchange=function(type){
					var hostItem=hostlist[this.selectedIndex];
					openhost.href=hostItem.showurl;
					openhost.title=hostItem.showurl;
					openhost.innerHTML='点此('+hostItem.title+')';
					if(type && hostItem.des)showTipMsg(hostItem.des);
				}
				dialog.linkload.style.display="none";
				dialog.linkbox.style.display="";
				dialog.isload=true;
				if(msgtext)myAlert(msgtext);
			}else{
				dialog.linkload.innerHTML=msgtext;
				hostconfig=null;
			}
		}else{
			dialog.linkload.innerHTML=msg[6];
			queryHost(dialog);
		}
		setDialogCenter(dialog);
	}
	function queryHost(dialog){
		var url=getApiUrl('gethost');
		GM_xmlhttpRequest({
			method: 'GET',
			url: url,
			onload: function(response){
				//alert(response.responseText);
				try{
					hostconfig=JSON.parse(response.responseText);
					if(dialog){
						setHostSelect(dialog);
					}
				}catch(err){
					if(dialog)queryHostErr(dialog,msg[9]);
				}
			},
			onerror: function(response){
				queryHostErr(dialog,msg[7]);
			},
			ontimeout: function(response){
				queryHostErr(dialog,msg[8]);
			}
		});
	}
	function queryHostErr(dialog,msgtext){
		if(!dialog)return;
		dialog.linkload.innerHTML=msgtext;
		$(dialog.linkload).find('a#retryqueryhost')[0].onclick=function(){
			dialog.linkload.innerHTML=msg[6];
			queryHost(dialog);
		};
		setDialogCenter(dialog);
	}
	function startQueryLink(dialog){
		if(dialog.isQueryLink){
			dialog.startBtn.innerHTML=msg[28];
			dialog.isQueryLink=false;
			queryLinkHwnd.abort();
			showTipMsg(msg[27]);
			return;
		}
		var sharelink=dialog.sharelinkbox.value,hostselect=dialog.hostselect,
		    linkhost=hostselect.value,hostindex=hostselect.selectedIndex;
		if(!linkhost){
			showTipMsg(msg[26]);
			return;
		}
		if(isUrl(sharelink)){
			dialog.linkresult.innerHTML='';
			showTipMsg(msg[12],1);
			setDialogCenter(dialog);
			queryLink(dialog,sharelink,linkhost,hostindex);
		}else{
			showTipMsg(msg[sharelink.length ? 11 : 25]);
			dialog.sharelinkbox.focus();
		}
	}
	function queryLink(dialog,sharelink,linkhost,hostindex){
		var hostlist=hostconfig.hostlist[hostindex],url=hostlist.queryhost || getApiUrl('getlink'),token=hostlist.token || '',hostdata=hostlist.hostdata || '',
		    data='sharelink='+encodeURIComponent(sharelink)+'&linkhost='+encodeURIComponent(linkhost)+'&token='+encodeURIComponent(token)+'&'+hostdata;
		dialog.isQueryLink=true;
		queryLinkHwnd=GM_xmlhttpRequest({
			method: 'POST',
			url: url,
			data:data,
			onload: function(response){
				//alert(response.responseText);
				try{
					var resLink=JSON.parse(response.responseText);
					if(0===resLink.status){
						var linklist=resLink.linklist;
						linkCache.limit=resLink.limit || linkCache.limit;
						linkCache.msg=resLink.msg;
						linkCache.ad=resLink.ad || '';
						linkCache.total=linklist.length;
						linkCache.linklist=linklist;
						linkCache.index=0;
						linkCache.sharelink=sharelink;
						linkCache.hostindex=hostindex;
						showResultLink(dialog);
					}else{
						queryLinkErr(dialog,resLink.msg);
					}
				}catch(err){
					queryLinkErr(dialog,msg[14]);
				}
			},
			onerror: function(response){
				queryLinkErr(dialog,msg[15]);
			},
			ontimeout: function(response){
				queryLinkErr(dialog,msg[16]);
			}
		});
		dialog.startBtn.innerHTML=msg[29];
	}
	function queryLinkErr(dialog,msgtext){
		dialog.isQueryLink=false;
		dialog.startBtn.innerHTML=msg[28];
		showTipMsg(msgtext,1);
	}
	function getLocalLink(dialog){
		if(dialog.isQueryLink){
			myAlert(msg[17]);
			return;
		}
		var sharelinkbox=dialog.sharelinkbox,reslinkbox=dialog.linkresult,url='',index=19;
		if(isShareManagerMode){
			var items=FileUtils.getListViewCheckedItems(),item=items[0];
			if(items.length>1){
				myAlert(msg[22]);
			}
			if(item){
				if(item.status){
					index=21;
				}else if(item.public!=disk.ui.ShareDialog.PUBLIC_LINK){
					index=23;
				}else if(item.typicalPath==msg[24]){
					index=24;
				}else{
					url=item.shortlink;
				}
			}else{
				index=20;
			}
		}else{
			url=decodeURIComponent(location.href).replace(decodeURIComponent(location.hash),'');
		}
		sharelinkbox.value=url;
		reslinkbox.innerHTML='';
		showTipMsg(msg[index]);
		setDialogCenter(dialog);
	}
	function showResultLink(dialog){
		dialog.isQueryLink=false;
		dialog.startBtn.innerHTML=msg[28];
		var linkbox=dialog.linkresult,html='',total=linkCache.total,limit=linkCache.limit,msgtext=linkCache.msg,
		    list=linkCache.linklist,page=Math.ceil(total/limit),i=total>limit ? limit : total;
		html+='<div style="padding:10px;font-size:12px;margin-top:-5px;">';
		html+='<dt style="padding:5px 10px 3px 0;"><b>外链结果：</b>';
		html+='<span style="float:right;">';
		html+='<span id="reslinkpage">共:&nbsp;1/'+page+'&nbsp;页</span>,&nbsp;'+total+'&nbsp;条&nbsp;&nbsp;';
		html+=page>1 ? '<a href="javascript:;"style="text-decoration:underline;"type="first">首页</a>&nbsp;&nbsp;&nbsp;<a href="javascript:;"style="text-decoration:underline;"type="next">下一页</a>&nbsp;&nbsp;&nbsp;<a href="javascript:;"style="text-decoration:underline;"type="prev">上一页</a>&nbsp;&nbsp;&nbsp;<a href="javascript:;"style="text-decoration:underline;"type="last">末页</a>' : '';
		html+='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
		html+='<a href="javascript:;"style="text-decoration:underline;"title="清空结果"type="clear">清空</a>&nbsp;&nbsp;&nbsp;&nbsp;</span>';
		html+='</dt>';
		for(var j=0;j<i;j++){
			html+='<div class="clearfix"style="margin-top:4px;"><input type="text"class="resultlink"maxlength="1024"style="width:540px;border:1px solid #BBD4EF;height:24px;line-height:24px;padding:2px;"></div>';
		}
		html+=linkCache.ad;
		html+='</div>';
		linkbox.innerHTML=html;
		linkbox.pagebox=$(linkbox).find('#reslinkpage')[0];
		var inputBox=$(linkbox).find('input');
		linkCache.pageindex=1;
		linkCache.index=inputBox.length-1;
		inputBox.mouseover(function(){this.select()});
		for(var m=0;m<inputBox.length;m++){
			inputBox[m].value=list[m];
		}
		$(linkbox).find('a').click(function(){
			linkResPageBar(dialog,linkbox,inputBox,page,$(this).attr('type'))
		});
		dialog.hostselect.options[linkCache.hostindex].selected=true;
		dialog.hostselect.onchange();
		dialog.sharelinkbox.value=linkCache.sharelink;
		setDialogCenter(dialog);
		showTipMsg(msgtext || msg[13],msgtext);
	}
	function linkResPageBar(dialog,box,o,page,type){
		if('clear'==type){
			box.innerHTML='';
			setDialogCenter(dialog);
			showTipMsg('');
			dialog.sharelinkbox.focus();
			return;
		}
		var pagebox=box.pagebox,i=0,total=linkCache.total,pageindex=linkCache.pageindex,
		    limit=linkCache.limit,list=linkCache.linklist;
		switch (type){
			case 'first':
				pageindex=1;
				break;
			case 'next':
				pageindex++;
				break;
			case 'prev':
				pageindex--;
				break;
			case 'last':
				pageindex=page;
				break;
		}
		pageindex=pageindex<1 ? 1 : pageindex >page ? page : pageindex;
		i=(pageindex-1)*limit;
		for(var j=0;j<limit;j++){
			var m=i+j;
			o[j].value=m<total ? list[m] : '';
		}
		linkCache.index=m>=total ? total-1 : m;
		linkCache.pageindex=pageindex;
		pagebox.innerHTML='共:&nbsp;'+pageindex+'/'+page+'&nbsp;页';
	}
	function setDialogCenter(dialog){
		dialog.setGravity(disk.ui.Panel.CENTER);
	}
	function showTipMsg(msg,type){
		var tipBox=$('#openlinktipmsg')[0];
		if(!tipBox)myAlert(msg);
		clearTimeout(tipHwnd);
		tipBox.innerHTML='<b>'+msg+'</b>';
		if(!type){
			tipHwnd=setTimeout(function(){
				tipBox.innerHTML="";
			}, 5000);
		}
	}
})();
function checkUpdate(){
	var js='var upinfo=document.getElementById("updateimg");';
	js+='upinfo.src="'+getApiUrl('checkupdate',1)+'";';
	js+='upinfo.onload=function(){';
	js+='upinfo.parentNode.parentNode.style.display="";';
	js+='}';
	loadJs(js);
}

function isUrl(url){return /^(http|https):\/\/([\w-]+(:[\w-]+)?@)?[\w-]+(\.[\w-]+)+(:[\d]+)?([#\/\?][^\s<>;"\']*)?$/.test(url);}
function getApiUrl(action,type){
	if(isNaN(type)){
		//return 'http://api.duoluohua.com/api/dupan/?action='+action+'&type=1&system=script&appname=dupanlink&version='+VERSION+'&t='+new Date().getTime();
		return 'http://localhost/yyft/myapp/api/dupan/?action='+action+'&type=1&system=script&appname=dupanlink&version='+VERSION+'&t='+new Date().getTime();
	}else{
		return 'http://app.duoluohua.com/update?action='+action+'&system=script&appname=dupanlink&apppot=scriptjs&frompot=dupan&type='+type+'&version='+VERSION+'&t='+t;
	}
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


