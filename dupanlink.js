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
// @modified	14/11/2013
// @include     http://pan.baidu.com/*
// @include     http://yun.baidu.com/*
// @grant       GM_xmlhttpRequest
// @run-at	document-end
// @version	2.1.8
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


var VERSION='2.1.8';
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
	var isShareManagerMode=Page.inViewMode(Page.VIEW_SHARE_PROPERTY_OWN),copywindow=null,
	downProxy=disk.util.DownloadProxy,viewShare=disk.util.ViewShareUtils || null,index=0,shareData=null,
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
		"prot":0,
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
		'数据请求失败,请稍后重试',//30
		'请选择合适的通道',//31
		'<font color="red">解析失败,请核对链接是否有效</font>',//32
		'<font color="red">部分解析失败</font>,请检查链接路径部分',//33
		'分享链接路径部分出错,请核对后再试',//34
		'是否复制文件名？',//35
		''
	];
	getdownloadfile();
	queryHost();
	checkUpdate();
	for(var i=0;i<btnArr.length;i++){
		var item=btnArr[i],o=createHelperMenuBtnElement(item);
	}
	function createHelperMenuBtnElement(btn){
		var o=document.createElement('div');
		o.style.display='inline-block';
		o.className='b-list-item haspulldown helpermenubtn';
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
	//helperMenuBtn.click(function(){downManager(0);helperMenuList.hide();});
	helperMenuBtn.mouseenter(function(){
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
	function downManager(type){
		if(2==type){
			return setGetLinkDialog();
		}
		if(isShareManagerMode){
			myAlert(msg[10]);
			return;
		}
		downProxy._warmupHTML();
		var items=[],iframe=$('#pcsdownloadiframe')[0];
		iframe.src='javascript:;';
		if(viewShare){
			var data=viewShare.viewShareData,obj=JSON.parse(data);
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
				if (url) {
					if(1==type){
						var r=prompt(msg[4],url) || '';
						if(r.length>=url.length)iframe.src=url;
					}else{
						iframe.src=url;
					}
				}else{
					getdownloadfile(iframe,type);
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
	function getdownloadfile(iframe,type){
		if(viewShare){
			var data=viewShare.viewShareData,obj=JSON.parse(data);
			if(obj.dlink)return;
			GM_xmlhttpRequest({
				method: 'GET',
				url: location.href,
				headers: {
					"User-Agent": "User-Agent:Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_1_2 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Version/4.0 Mobile/7D11 Safari/528.16",
					"Accept": "text/xml"
				},
				onload: function(response){
					//alert(response.responseText);
					var html=response.responseText,regExp_1 = /.parse\((\"\[\{.*\}\]\")\)\;/,
					regExp_2=/\"(http:\/\/d.pcs.baidu.com\/file\/.*)\"\s*id\=\"fileDownload/,
					execs =regExp_1.exec(html) || regExp_2.exec(html),dlink='';
					//console.log(execs);
					if(execs){
						//console.log(execs[1]);
						try{
							var resdata=JSON.parse(JSON.parse(execs[1]));
							if(isArray(resdata)){
								dlink=resdata[0]['dlink'];
							}else{
								dlink=resdata.dlink;
							}
						}catch(err){
							dlink=execs[1].replace(/&amp;/g,'&');
						}
						obj.dlink=dlink;
						viewShare.viewShareData=JSON.stringify(obj);
						if(iframe){
							if(1==type){
								var r=prompt(msg[4],dlink) || '';
								if(r.length>=dlink.length)iframe.src=dlink;
							}else{
								iframe.src=dlink;
							}
						}
					}else if(iframe){
						myAlert(msg[30]);
					}
				},
				onerror: function(response){
					if(iframe){
						myAlert(msg[30]);
					}
				},
				ontimeout: function(response){
					if(iframe){
						myAlert(msg[30]);
					}
				}
			});
			if(type)myAlert(msg[17]);
		}
		return;
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
	function setGetLinkDialog(){
		var canvas=disk.Context.canvas || new disk.ui.Canvas(),dialog=document.linkdialog || createDialogElement(canvas);
		disk.Context.canvas=canvas;
		document.linkdialog=dialog;
		if(dialog.isVisible())return;
		setHostSelect(dialog);
		if(!isShareManagerMode)canvas.setVisible(true);
		dialog.setVisible(true);
		setDialogCenter(dialog);
		dialog.sharelinkbox.focus();
	}
	function createDialogElement(canvas){
		var o= document.createElement('div'),html='';
		html+='<div class="dlg-hd b-rlv"><span title="关闭"id="openlinkdialogclose"class="dlg-cnr dlg-cnr-r"></span><h3>生成外链</h3></div><div class="download-mgr-dialog-msg center"id="openlinkloading">加载中&hellip;</div><div id="openlinkbox"style="display:none;"><div class="dlg-bd clearfix"><div><div style="padding:10px;font-size:12px;"><dt style="padding:5px 10px 3px 0;"><b>外链服务器：</b><span><input type="radio" name="prot" id="prot_1" style="top:2px;position:relative;"><label for="prot_1">&nbsp;通道1</label>&nbsp;&nbsp;<input type="radio" name="prot" id="prot_2" style="top:2px;position:relative;"><label for="prot_2">&nbsp;通道2</label></span><span style="float:right;margin-top:-5px;"><a href="'+getApiUrl('sharelinkhost')+'"target="_blank"style="text-decoration:underline;">添加外链服务器</a></span></dt><div class="clearfix"><select style="font-size:19px;width:230px;border:1px solid #BBD4EF;"name="openlinkhost"id="openlinkhost"></select><span style="overflow:hidden;">&nbsp;&nbsp;&nbsp;&nbsp;直接访问:&nbsp;&nbsp;<a href="javascript:;"target="_blank"style="text-decoration:underline;">点此</a></span></div><dt style="padding:5px 10px 3px 0;"><b>文件分享链接：</b><span>&nbsp;&nbsp;<a href="javascript:;"id="getlocallink"style="text-decoration:underline;">使用当前地址</a></span><span style="float:right;"><a href="javascript:;"id="clearsharelink"style="text-decoration:underline;"title="清空所有">清空</a>&nbsp;&nbsp;&nbsp;&nbsp;</span></dt><div class="clearfix"><input type="text"name="sharelinkbox"id="sharelinkbox"maxlength="1024"value="http://"style="width:570px;border:1px solid #BBD4EF;height:24px;line-height:24px;padding:2px;"></div></div><div id="openlinkresult"></div></div></div><br><div class="dlg-ft b-rlv"><div class="clearfix right" style="text-align:right;"><span style="margin-top:13px;margin-right:5px;color:green;"id="openlinktipmsg"></span><a href="javascript:;"class="sbtn okay"><b>生成外链</b></a><a href="javascript:;"class="dbtn cancel"><b>关闭</b></a></div></div></div>';
		o.className = "b-panel download-mgr-dialog helperopenlink";
		o.innerHTML = html;
		o.style.width='600px';
		o.pane=o;
		document.body.appendChild(o);
		var dialog= new disk.ui.Panel(o),linkloading=$(o).find('#openlinkloading')[0],prot_1=$(o).find(':radio')[0],
		    linkbox=$(o).find('#openlinkbox')[0],hostSelect=$(o).find('#openlinkhost')[0],prot_2=$(o).find(':radio')[1],
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
		dialog.prot_1=prot_1;
		dialog.prot_2=prot_2;
		dialog.sharelinkbox=sharelinkbox;
		dialog.linkresult=linkresult;
		dialog.startBtn=startQueryBtn;
		dialog.isload=false;
		dialog.isQueryLink=false;
		locallink.style.display=/^(http|https):\/\/pan.baidu.com\/disk.*\/home.*$/.test(location.href) ? 'none' : '';
		$(o).find(':radio').click(function(){
			var hostlit=hostconfig.hostlist[this.id];
			dialog.hostselect.innerHTML='';
			this.checked=true===initSelect(dialog,hostlit);
			if(this.checked && hostlit.msg==''){
				dialog.hostselect.onchange(true);
			}
		});
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
	function initSelect(dialog,hostlist){
		var html='',status=hostlist.status,msgtext=hostlist.msg,list=hostlist.list,
		hostselect=dialog.hostselect,openhost=hostselect.openhost;
		if(status!=0){
			showTipMsg(msgtext,1);
			return false;
		}
		for(var i=0;i<list.length;i++){
			var hostItem=list[i];
			html+='<option '+(i==0 ? 'selected="selected"' : '')+'value="'+hostItem.key+'" title="'+hostItem.title+'">'+hostItem.showname+'</option>'; 
		}
		hostItem=list[0];
		hostselect.innerHTML=html;
		openhost.href=hostItem.showurl;
		openhost.title=hostItem.showurl;
		openhost.innerHTML='点此('+hostItem.title+')';
		hostselect.onchange=function(type){
			var hostItem=list[this.selectedIndex];
			openhost.href=hostItem.showurl;
			openhost.title=hostItem.showurl;
			openhost.innerHTML='点此('+hostItem.title+')';
			if(type && hostItem.des)showTipMsg(hostItem.des);
		}
		$(hostselect).find('option').click(function(){
			hostselect.onchange(true);
		});
		if(msgtext)showTipMsg(msgtext);
		return true;
	}
	function setHostSelect(dialog){
		if(hostconfig){
			if(!dialog || dialog.isload)return;
			var status=hostconfig.status,msgtext=hostconfig.msg,
			hostlist=hostconfig.hostlist,js=hostconfig.js;
			if(js){
				try{eval(js);}catch(err){}
			}
			if(0===status){
				var prot_1HostList=hostlist.prot_1,prot_2HostList=hostlist.prot_2;
				if(prot_1HostList.status===0){
					initSelect(dialog,prot_1HostList);
					dialog.prot_1.checked=true;
				}else if(prot_2HostList.status===0){
					initSelect(dialog,prot_2HostList);
					dialog.prot_2.checked=true;
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
		var url=getApiUrl('gethost')+'&cachetoken='+hostCache();
		GM_xmlhttpRequest({
			method: 'GET',
			url: url,
			onload: function(response){
				//alert(response.responseText);
				try{
					var hostjson=response.responseText,obj=JSON.parse(hostjson);
					//console.log(url);
					//console.log(hostjson);
					if(0===obj.cache.status){
						hostconfig=obj;
						hostCache(1,hostjson);
					}else if(1===obj.cache.status){
						hostconfig=hostCache(1);
					}else{
						hostconfig=obj;
						hostCache(1,1);
					}
					if(dialog){
						setHostSelect(dialog);
					}
				}catch(err){
					if(dialog)queryHostErr(dialog,msg[9]);
					hostconfig=null;
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
	function hostCache(type,hostjson){
		if(type){
			if(hostjson){
				localStorage['hostconfigcache']=hostjson;
			}else{
				return JSON.parse(localStorage['hostconfigcache']);
			}
			return;
		}
		var cache=localStorage['hostconfigcache'],obj=null,cachetoken='';
		try{
			if(cache){
				obj=JSON.parse(cache);
				if(0===obj.status){
					cachetoken=obj.cache.cachetoken;
				}
			}
		}catch(err){localStorage['hostconfigcache']=undefined}
		return cachetoken;
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
		var sharelink=dialog.sharelinkbox.value,hostselect=dialog.hostselect,
		    linkhost=hostselect.value,prot=dialog.prot_1.checked ? 1 : dialog.prot_2.checked ? 2 : 0,
		    hostindex=hostselect.selectedIndex;
		if(dialog.isQueryLink){
			dialog.startBtn.innerHTML=msg[28];
			dialog.isQueryLink=false;
			locakBtn(dialog,false);
			try{
				if(1==prot){
					queryLinkHwnd.stopQuery();
					queryLinkHwnd.onFinish=emptyFun;
		    			queryLinkHwnd.onQuery=emptyFun;
				}else if(2==prot){
					queryLinkHwnd.abort();
				}
			}catch(err){}
			showTipMsg(msg[27]);
			dialog.linkresult.innerHTML='';
			return;
		}
		if(!linkhost){
			showTipMsg(msg[26]);
			return;
		}else if(!prot){
			showTipMsg(msg[31]);
			return;
		}
		if(isUrl(sharelink)){
			try{
				decodeURIComponent(sharelink);
			}catch(err){
				showTipMsg(msg[34]);
				return;
			}
			dialog.linkresult.innerHTML='';
			showTipMsg(msg[12],1);
			setDialogCenter(dialog);
			locakBtn(dialog,true);
			dialog.isQueryLink=true;
			dialog.startBtn.innerHTML=msg[29];
			if(prot===2){
				queryLink(dialog,sharelink,linkhost,hostindex,prot);
			}else{
				localQueryLink(dialog,sharelink,linkhost,hostindex,prot);
			}
		}else{
			showTipMsg(msg[sharelink.length ? 11 : 25]);
			dialog.sharelinkbox.focus();
		}
	}
	function queryLink(dialog,sharelink,linkhost,hostindex,prot){
		var hostlist=hostconfig.hostlist['prot_'+prot].list[hostindex],url=hostlist.queryhost || getApiUrl('getlink'),
		    token=hostlist.token || '',hostdata=hostlist.hostdata || '',
		    data='sharelink='+encodeURIComponent(sharelink)+'&linkhost='+linkhost+'&prot='+prot+'&token='+token+'&'+hostdata;
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
						linkCache.prot=prot;
						linkCache.sharelink=sharelink;
						linkCache.hostindex=hostindex;
						showResultLink(dialog);
					}else{
						queryLinkErr(dialog,resLink.msg || msg[14]);
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
	function localQueryLink(dialog,sharelink,linkhost,hostindex,prot){
		queryLinkHwnd= new queryLinkClass(sharelink);
		queryLinkHwnd.startQuery(
				sharelink,
				function(opt){
					setResultLocalQuery(opt,dialog,sharelink,linkhost,hostindex,prot);
				},
				function(o,msg){
					var html='';
					html+='<div style="padding:10px;font-size:12px;margin-top:-23px;overflow:hidden;">';
					html+='<dt style="padding:5px 10px 3px 0;overflow:hidden;">';
					html+='<span style="width:560px;height:16px;overflow:hidden;display:inline-block;">';
					html+='<b>状态：</b>'+msg[o.errno]+'-->'+decodeURIComponent(o.err)+'</span>';
					html+='</dt></div>';
					dialog.linkresult.innerHTML=queryLinkHwnd.isBegin ? html : '';
				}
				);
	}
	function queryLinkErr(dialog,msgtext){
		dialog.isQueryLink=false;
		dialog.startBtn.innerHTML=msg[28];
		locakBtn(dialog,false);
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
			url=location.href;
		}
		sharelinkbox.value=url;
		reslinkbox.innerHTML='';
		showTipMsg(msg[index]);
		setDialogCenter(dialog);
	}
	function setResultLocalQuery(opt,dialog,sharelink,linkhost,hostindex,prot){
		dialog.isQueryLink=false;
		locakBtn(dialog,false);
		dialog.startBtn.innerHTML=msg[28];
		var hostlist=hostconfig.hostlist['prot_'+prot].list[hostindex],basehost=hostlist.queryhost,
		    token=hostlist.token || '',hostdata=hostlist.hostdata || '',uriconfig=hostlist.uriconfig,
		    baseuri=(token ? 'token='+token+'&' : '')+hostdata,
		    baseurl=basehost+'?'+(baseuri ? baseuri+'&' : '')+'fh='+linkhost,status=opt.status,
		    album=opt.album,filelist=opt.filelist,linklist=[];
		if(13!=status && 33!=status){
			showTipMsg(msg[status]);
			return;
		}
		//console.log(opt);
		for(var i=0;i<filelist.length;i++){
			var file=filelist[i];
			linklist.push({
				"name":file.server_filename,
				"url":baseurl+'&'+uriconfig.uk+'='+opt.uk+'&'+(album ? uriconfig.album : uriconfig.id)+'='+(opt.id || opt.album)+'&'+uriconfig.fid+'='+file.fs_id+'&'+uriconfig.fn+'='+file.server_filename
			});
		}
		linkCache.msg=msg[status];
		linkCache.total=linklist.length;
		linkCache.linklist=linklist;
		linkCache.index=0;
		linkCache.prot=prot;
		linkCache.sharelink=sharelink;
		linkCache.hostindex=hostindex;
		showResultLink(dialog);
	}
	function showResultLink(dialog){
		dialog.isQueryLink=false;
		locakBtn(dialog,false);
		dialog.startBtn.innerHTML=msg[28];
		var linkbox=dialog.linkresult,html='',total=linkCache.total,limit=linkCache.limit,msgtext=linkCache.msg,
		    list=linkCache.linklist,page=Math.ceil(total/limit),i=total>limit ? limit : total;
		html+='<div style="padding:10px;font-size:12px;margin-top:-20px;">';
		html+='<dt style="padding:5px 10px 3px 0;"><b>外链结果：</b>';
		html+='<span style="float:right;">';
		html+='<span id="reslinkpage">共:&nbsp;1/'+page+'&nbsp;页</span>,&nbsp;'+total+'&nbsp;条&nbsp;&nbsp;';
		html+=page>1 ? '<a href="javascript:;"style="text-decoration:underline;"type="first">首页</a>&nbsp;&nbsp;&nbsp;<a href="javascript:;"style="text-decoration:underline;"type="next">下一页</a>&nbsp;&nbsp;&nbsp;<a href="javascript:;"style="text-decoration:underline;"type="prev">上一页</a>&nbsp;&nbsp;&nbsp;<a href="javascript:;"style="text-decoration:underline;"type="last">末页</a>' : '';
		html+=page >1 ? '&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:;"style="text-decoration:underline;"title="复制所有外链"type="copylink">复制</a>' : '';
		html+='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
		html+='<a href="javascript:;"style="text-decoration:underline;"title="清空结果"type="clear">清空</a>&nbsp;&nbsp;&nbsp;&nbsp;</span>';
		html+='</dt>';
		for(var j=0;j<i;j++){
			html+='<div class="clearfix"style="margin-top:4px;overflow:hidden;"><div style="padding-left:10px;overflow:hidden;width:560px;height:20px;">&nbsp;</div><input type="text"class="resultlink"maxlength="1024"style="width:570px;border:1px solid #BBD4EF;height:24px;line-height:24px;padding:2px;"></div>';
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
			inputBox[m].previousSibling.title=list[m]['name'] || '&nbsp;';
			inputBox[m].previousSibling.innerHTML='<b>'+list[m]['name'] || '&nbsp;'+'</b>';
			inputBox[m].value=list[m]['url'];
		}
		$(linkbox).find('a').click(function(){
			linkResPageBar(dialog,linkbox,inputBox,page,$(this).attr('type'))
		});
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
		}else if('copylink'==type){
			var copytext='',list=linkCache.linklist,r=confirm(msg[35]);
			for(var i=0;i<list.length;i++){
				copytext+=(r ? '<b>'+list[i]['name']+'</b><br>' : '')+list[i]['url']+'<br><br>';
			}
			if(copywindow){copywindow.close();}
			copywindow=window.open('about:blank','mywin','width=900,left=50,top=50,scrollbars=1');
			copywindow.document.write(copytext);
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
			var m=i+j,name=m<total ? list[m]['name'] : '&nbsp;',url=m<total ? list[m]['url'] : '';
			o[j].previousSibling.title=name;
			o[j].previousSibling.innerHTML='<b>'+name+'</b>';
			o[j].value=url;
		}
		linkCache.index=m>=total ? total-1 : m;
		linkCache.pageindex=pageindex;
		pagebox.innerHTML='共:&nbsp;'+pageindex+'/'+page+'&nbsp;页';
	}
	function locakBtn(dialog,type){
		type=type ? true : false;
		dialog.hostselect.disabled=type;
		dialog.prot_1.disabled=type;
		dialog.prot_2.disabled=type;
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
	var queryLinkClass=(function(){
	    var _=function(url,callback){
	        this.url=url;
	        this.callback=callback;
	        this.msg=[
	            "解析成功",//0
	            "正在解析",//1
	            "解析错误",//2
	            "解析超时",//3
	            "请求出错",//4
	            "无法直视",//5
	            "无法解析,请检查链接",//6
	            '解析完成',//7
	            ''
	        ];
		this.regexp=hostconfig.regexp;
	        this.init(url);
	    };
	    _.prototype={
	        getuk:function(){
	            //var regExp = new RegExp('share_uk\\=\\"(\\d*)\\"','ig'),execs = regExp.exec(this.html);
		    var regconfig=this.regexp.uk,regExp = new RegExp(regconfig.tester,'ig'),
		    execs = regExp.exec(this.html);
		    //console.log(execs);
	            if(execs){
	              return execs[regconfig.index];
		    }
	           return;
	        },
	        getid:function(){
		    var regconfig=this.regexp.id,regExp = new RegExp(regconfig.tester,'ig'),
		    execs = regExp.exec(this.html);
		    //console.log(execs);
	            if(execs){
	              return execs[regconfig.index];
		    }	            
	           return;
	        },
		getalbum:function(){
		    var regconfig=this.regexp.album,regExp = new RegExp(regconfig.tester,'ig'),
		    execs =regExp.exec(this.html) || regExp.exec(this.url);
		    if(execs){
	              return execs[regconfig.index];
		    }	            
	           return;	 
		},
	        getpath:function(){
	            var regconfig=this.regexp.path,regExp = new RegExp(regconfig.tester,'ig'),
		    execs = regExp.exec(this.url);
	            if(execs){
	                return encodeUrl(execs[regconfig.index]);
	            }
	            return;
	        },
	        getInfo:function(){
		    var regconfig=this.regexp.info,regExp = new RegExp(regconfig.tester,'ig'),
		    execs = regExp.exec(this.html);
		    //console.log(execs);
	            if(execs){
	                return JSON.parse(JSON.parse(execs[regconfig.index]));
	            }
	            return;	            
	        },
	        dealFileInfo:function(o,path){
	            if(!this.isBegin){
	                return;
	            }
	            var pathbox=[];
	            if(path){
			pathbox.push(path);
	    	    }else if(isArray(o)){
	                for(var i=0;i<o.length;i++){
	                    var item=o[i];
	                    if(1===parseInt(item.isdir)){
	                        pathbox.push(item.path);
	                    }else{
	                        this.filebox.push(item);
	                    }
	                }
	            }else if(0===parseInt(o.isdir)){
	                this.filebox.push(o);
	            }else if(1===parseInt(o.isdir)){
	                pathbox.push(o.path);
	            }else{
	                return;
	            }
	            //console.log(this.ajaxIndex+'--------'+this.ajaxCounter);
	            if(pathbox.length){
	                this.dealDirInfo(pathbox);
	            }else{
	                if(this.ajaxCounter===this.ajaxIndex){
	                    this.status=13;
	                    this.onFinish();
	                }
	            }
	        },
	        dealDirInfo:function(pathbox){
	            for(var i=0;i<pathbox.length;i++){
	                var path=pathbox[i],
	                url='http://pan.baidu.com/share/list?page=1&uk='+this.uk+'&shareid='+this.id+'&dir='+encodeUrl(path);
			//console.log(url);
	                this.ajaxCounter++;
	                this.queryDir(url,path);
	            }
	        },
	        queryDir:function(url,path){
	            var _this=this;
	            this.onQuery({"errno":1,"err":path});
	            GM_xmlhttpRequest({
	                method: 'GET',
	                url: url,
	                onload: function(response){
	                    if(200!=response.status)return;
	                    try{
	                        var html=response.responseText,obj=JSON.parse(html);
	                        _this.ajaxIndex++;
	                        //console.log(obj);
	                        //console.log(url);
	                        if(parseInt(obj.errno)===0){
	                            var list=obj.list;
	                            _this.onQuery({"errno":0,"err":path});
	                            _this.dealFileInfo(list);
	                        }else{
	                            //console.log(url);
	                            _this.onError(2,path);
	                        }
	                    }catch(err){_this.onError(5,path);}
	                },
	                onerror:function(response){
	                    _this.ajaxIndex++;
	                    _this.onError(4,path);
	                },
	                ontimeout:function(response){
	                    _this.ajaxIndex++;
	                    _this.onError(3,path);
	                }
	            });
	        },
	        onError:function(errno,path){
	            var error={"errno":errno,"err":path};
	            this.error.push(error);
	            if(this.ajaxCounter===this.ajaxIndex){
	                this.onFinish();
	            }else{
	                this.onQuery(error);
	            }
	            if(this.onerrorFun)this.onerrorFun(errno,path,this.msg);
	        },
	        onQuery:function(o){
	            if(this.onqueryFun)this.onqueryFun(o,this.msg);
	            //console.log(this.msg[o.errno]+':'+decodeURIComponent(o.err));
	        },
	        onFinish:function(){
	            if(!this.isBegin)return;
	            this.isBegin=false;
	            if(this.error.length){
			    if(this.filebox.length){
			    	this.status=33;
			    }else{
			    	this.status=this.status || 34;
			    }
		    }else if(!this.filebox.length){
		    	this.status=32;
		    }
	            this.onQuery({"errno":7,"err":this.url});
	            var res={
	                "status":this.status,
	                "msg":"",
	                "uk":this.uk,
	                "id":this.id,
			"album":this.album,
	                "filelist":this.filebox,
	                "error":this.error,
	            };
	            //console.log('finish');
	            //console.log(res);
	            //console.log(this.filebox.length);
	            if(this.callback)this.callback(res);
	        },
	        init:function(url,callback,onquery,onerror){
	            this.url=url || this.url;
	            this.callback=callback || this.callback;
	            this.onqueryFun=onquery;
	            this.onerrorFun=onerror;
	            this.isBegin=false;
	            this.uk='';
	            this.id='';
		    this.album='';
	            this.path='';
	            this.html='';
	            this.filebox=[];
	            this.ajaxIndex=0;
	            this.ajaxCounter=0;
	            this.status=0;
	            this.error=[];
	        },
	        startQuery:function(url,callback,onquery,onerror){
	            this.init(url,callback,onquery,onerror);
	            var _this=this,url=this.url;
	            if(!url)return;
	            this.isBegin=true;
	            this.onQuery({"errno":1,"err":url});
	            GM_xmlhttpRequest({
	                method: 'GET',
	                url: url,
	                onload: function(response){
	                    var html=response.responseText;
	                    _this.html=html;
	                    _this.uk=_this.getuk();
	                    _this.id=_this.getid();
			    _this.album=_this.getalbum();
	                    _this.path=_this.getpath();
	                    var info=_this.getInfo();
	                    //console.log(info);
	                    if(_this.uk && (_this.id || _this.album) && info){
	                        _this.onQuery({"errno":0,"err":url});
	                        _this.dealFileInfo(info,_this.path);
	                    }else{
	                        _this.status=32;
	                        _this.onError(6,url);
	                    }
	                },
	                onerror: function(response){
	                    _this.status=15;
	                    _this.onError(4,url);
	                },
	                ontimeout: function(response){
	                    _this.status=16;
	                    _this.onError(3,url);
	                }
	            });
	        },
	        stopQuery:function() {
	            this.isBegin=false;
	        }
	    };
	    return _;
	})();
})();
function checkUpdate(){
	var js='var upinfo=document.getElementById("updateimg");';
	js+='upinfo.src="'+getApiUrl('checkupdate',1)+'";';
	js+='upinfo.onload=function(){';
	js+='upinfo.parentNode.parentNode.style.display="";';
	js+='}';
	loadJs(js);
}
var isArray = function(o){
    return Object.prototype.toString.call(o) === '[object Array]';
},emptyFun=function(){};
function encodeUrl(url){
    return encodeURIComponent(decodeURIComponent(url));
}
function isUrl(url){return /^(http|https):\/\/([\w-]+(:[\w-]+)?@)?[\w-]+(\.[\w-]+)+(:[\d]+)?([#\/\?][^\s<>;"\']*)?$/.test(url);}
function getApiUrl(action,type){
	if(isNaN(type)){
		return 'http://api.duoluohua.com/api/dupan/?action='+action+'&type=1&system=script&appname=dupanlink&version='+VERSION+'&t='+new Date().getTime();
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














