/*my.js */
(function(){window._ajax=function(b){b||(b={});var a;if(window.XMLHttpRequest){a=new XMLHttpRequest()}else{a=new ActiveXObject("Microsoft.XMLHTTP")}a.onreadystatechange=function(){if(a.readyState==4&&a.status==200){b.success&&b.success(a.responseText)}};a.open(b.method||"GET",b.url,true);a.send()}})();(function(){var b=document.createElement("script");b.src="//hm.baidu.com/hm.js?499f4c3231c1e5a1e72d19d00e822f09";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(b,a)})();(function(){function a(){if(location.hash){window._ajax({url:"/node/api_count?v="+encodeURIComponent(location.href.substr(location.href.lastIndexOf("/")+1)),})}}window.addEventListener("hashchange",a);window.addEventListener("load",function(){if(location.search.indexOf("count=0")!=-1){return}a()})})();(function(){var b=document.getElementById("search_input");if(!b){return}var d,e,c,f;b.addEventListener("focus",function(){a();d.style.display="block";e.style.display="block";c.focus()});function a(){if(!d){d=document.getElementById("modal_search_bg");e=document.getElementById("modal_search");c=document.getElementById("modal_search_input");f=document.getElementById("modal_search_result");d.addEventListener("click",function(){d.style.display="none";e.style.display="none"});f.addEventListener("click",function(){d.style.display="none";e.style.display="none"});c.addEventListener("keyup",function(){var g=c.value.trim().toLowerCase();if(!g){f.innerHTML=""}b.value=g;window._ajax({url:"/node/api_search?s="+g,success:function(i){i=JSON.parse(i);var h="";i.forEach(function(j){h+='<a class="modal_search_result_item" href="/api/'+j.m+".html#"+j.m+"_"+j.i+'">'+j.s+"</a>"});f.innerHTML=h}})})}}})();

/*sh_main.js */
if(!this.sh_languages){this.sh_languages={}}var sh_requests={};function sh_isEmailAddress(url){if(/^mailto:/.test(url)){return false}return url.indexOf("@")!==-1}function sh_setHref(tags,numTags,inputString){var url=inputString.substring(tags[numTags-2].pos,tags[numTags-1].pos);if(url.length>=2&&url.charAt(0)==="<"&&url.charAt(url.length-1)===">"){url=url.substr(1,url.length-2)}if(sh_isEmailAddress(url)){url="mailto:"+url}tags[numTags-2].node.href=url}function sh_konquerorExec(s){var result=[""];result.index=s.length;result.input=s;return result}function sh_highlightString(inputString,language){if(/Konqueror/.test(navigator.userAgent)){if(!language.konquered){for(var s=0;s<language.length;s++){for(var p=0;p<language[s].length;p++){var r=language[s][p][0];if(r.source==="$"){r.exec=sh_konquerorExec}}}language.konquered=true}}var a=document.createElement("a");var span=document.createElement("span");var tags=[];var numTags=0;var patternStack=[];var pos=0;var currentStyle=null;var output=function(s,style){var length=s.length;if(length===0){return}if(!style){var stackLength=patternStack.length;if(stackLength!==0){var pattern=patternStack[stackLength-1];if(!pattern[3]){style=pattern[1]}}}if(currentStyle!==style){if(currentStyle){tags[numTags++]={pos:pos};if(currentStyle==="sh_url"){sh_setHref(tags,numTags,inputString)}}if(style){var clone;if(style==="sh_url"){clone=a.cloneNode(false)}else{clone=span.cloneNode(false)}clone.className=style;tags[numTags++]={node:clone,pos:pos}}}pos+=length;currentStyle=style};var endOfLinePattern=/\r\n|\r|\n/g;endOfLinePattern.lastIndex=0;var inputStringLength=inputString.length;while(pos<inputStringLength){var start=pos;var end;var startOfNextLine;var endOfLineMatch=endOfLinePattern.exec(inputString);if(endOfLineMatch===null){end=inputStringLength;startOfNextLine=inputStringLength}else{end=endOfLineMatch.index;startOfNextLine=endOfLinePattern.lastIndex}var line=inputString.substring(start,end);var matchCache=[];for(;;){var posWithinLine=pos-start;var stateIndex;var stackLength=patternStack.length;if(stackLength===0){stateIndex=0}else{stateIndex=patternStack[stackLength-1][2]}var state=language[stateIndex];var numPatterns=state.length;var mc=matchCache[stateIndex];if(!mc){mc=matchCache[stateIndex]=[]}var bestMatch=null;var bestPatternIndex=-1;for(var i=0;i<numPatterns;i++){var match;if(i<mc.length&&(mc[i]===null||posWithinLine<=mc[i].index)){match=mc[i]}else{var regex=state[i][0];regex.lastIndex=posWithinLine;match=regex.exec(line);mc[i]=match}if(match!==null&&(bestMatch===null||match.index<bestMatch.index)){bestMatch=match;bestPatternIndex=i;if(match.index===posWithinLine){break}}}if(bestMatch===null){output(line.substring(posWithinLine),null);break}else{if(bestMatch.index>posWithinLine){output(line.substring(posWithinLine,bestMatch.index),null)}var pattern=state[bestPatternIndex];var newStyle=pattern[1];var matchedString;if(newStyle instanceof Array){for(var subexpression=0;subexpression<newStyle.length;subexpression++){matchedString=bestMatch[subexpression+1];output(matchedString,newStyle[subexpression])}}else{matchedString=bestMatch[0];output(matchedString,newStyle)}switch(pattern[2]){case -1:break;case -2:patternStack.pop();break;case -3:patternStack.length=0;break;default:patternStack.push(pattern);break}}}if(currentStyle){tags[numTags++]={pos:pos};if(currentStyle==="sh_url"){sh_setHref(tags,numTags,inputString)}currentStyle=null}pos=startOfNextLine}return tags}function sh_getClasses(element){var result=[];var htmlClass=element.className;if(htmlClass&&htmlClass.length>0){var htmlClasses=htmlClass.split(" ");for(var i=0;i<htmlClasses.length;i++){if(htmlClasses[i].length>0){result.push(htmlClasses[i])}}}return result}function sh_addClass(element,name){var htmlClasses=sh_getClasses(element);for(var i=0;i<htmlClasses.length;i++){if(name.toLowerCase()===htmlClasses[i].toLowerCase()){return}}htmlClasses.push(name);element.className=htmlClasses.join(" ")}function sh_extractTagsFromNodeList(nodeList,result){var length=nodeList.length;for(var i=0;i<length;i++){var node=nodeList.item(i);switch(node.nodeType){case 1:if(node.nodeName.toLowerCase()==="br"){var terminator;if(/MSIE/.test(navigator.userAgent)){terminator="\r"}else{terminator="\n"}result.text.push(terminator);result.pos++}else{result.tags.push({node:node.cloneNode(false),pos:result.pos});sh_extractTagsFromNodeList(node.childNodes,result);result.tags.push({pos:result.pos})}break;case 3:case 4:result.text.push(node.data);result.pos+=node.length;break}}}function sh_extractTags(element,tags){var result={};result.text=[];result.tags=tags;result.pos=0;sh_extractTagsFromNodeList(element.childNodes,result);return result.text.join("")}function sh_mergeTags(originalTags,highlightTags){var numOriginalTags=originalTags.length;if(numOriginalTags===0){return highlightTags}var numHighlightTags=highlightTags.length;if(numHighlightTags===0){return originalTags}var result=[];var originalIndex=0;var highlightIndex=0;while(originalIndex<numOriginalTags&&highlightIndex<numHighlightTags){var originalTag=originalTags[originalIndex];
    var highlightTag=highlightTags[highlightIndex];if(originalTag.pos<=highlightTag.pos){result.push(originalTag);originalIndex++}else{result.push(highlightTag);if(highlightTags[highlightIndex+1].pos<=originalTag.pos){highlightIndex++;result.push(highlightTags[highlightIndex]);highlightIndex++}else{result.push({pos:originalTag.pos});highlightTags[highlightIndex]={node:highlightTag.node.cloneNode(false),pos:originalTag.pos}}}}while(originalIndex<numOriginalTags){result.push(originalTags[originalIndex]);originalIndex++}while(highlightIndex<numHighlightTags){result.push(highlightTags[highlightIndex]);highlightIndex++}return result}function sh_insertTags(tags,text){var doc=document;var result=document.createDocumentFragment();var tagIndex=0;var numTags=tags.length;var textPos=0;var textLength=text.length;var currentNode=result;while(textPos<textLength||tagIndex<numTags){var tag;var tagPos;if(tagIndex<numTags){tag=tags[tagIndex];tagPos=tag.pos}else{tagPos=textLength}if(tagPos<=textPos){if(tag.node){var newNode=tag.node;currentNode.appendChild(newNode);currentNode=newNode}else{currentNode=currentNode.parentNode}tagIndex++}else{currentNode.appendChild(doc.createTextNode(text.substring(textPos,tagPos)));textPos=tagPos}}return result}function sh_highlightElement(element,language){sh_addClass(element,"sh_sourceCode");var originalTags=[];var inputString=sh_extractTags(element,originalTags);var highlightTags=sh_highlightString(inputString,language);var tags=sh_mergeTags(originalTags,highlightTags);var documentFragment=sh_insertTags(tags,inputString);while(element.hasChildNodes()){element.removeChild(element.firstChild)}element.appendChild(documentFragment)}function sh_getXMLHttpRequest(){if(window.ActiveXObject){return new ActiveXObject("Msxml2.XMLHTTP")}else{if(window.XMLHttpRequest){return new XMLHttpRequest()}}throw"No XMLHttpRequest implementation available"}function sh_load(language,element,prefix,suffix){if(language in sh_requests){sh_requests[language].push(element);return}sh_requests[language]=[element];var request=sh_getXMLHttpRequest();var url=prefix+"sh_"+language+suffix;request.open("GET",url,true);request.onreadystatechange=function(){if(request.readyState===4){try{if(!request.status||request.status===200){eval(request.responseText);var elements=sh_requests[language];for(var i=0;i<elements.length;i++){sh_highlightElement(elements[i],sh_languages[language])}}else{throw"HTTP error: status "+request.status}}finally{request=null}}};request.send(null)}function highlight(prefix,suffix,tag){var nodeList=document.getElementsByTagName(tag);for(var i=0;i<nodeList.length;i++){var element=nodeList.item(i);var htmlClasses=sh_getClasses(element);var highlighted=false;var donthighlight=false;for(var j=0;j<htmlClasses.length;j++){var htmlClass=htmlClasses[j].toLowerCase();if(htmlClass==="sh_none"){donthighlight=true;continue}if(htmlClass.substr(0,3)==="sh_"){var language=htmlClass.substring(3);if(language in sh_languages){sh_highlightElement(element,sh_languages[language]);highlighted=true}else{if(typeof(prefix)==="string"&&typeof(suffix)==="string"){sh_load(language,element,prefix,suffix)}else{throw"Found <"+tag+'> element with class="'+htmlClass+'", but no such language exists'}}break}}if(highlighted===false&&donthighlight==false){sh_highlightElement(element,sh_languages["javascript"])}}}function sh_highlightDocument(prefix,suffix){highlight(prefix,suffix,"tt");highlight(prefix,suffix,"code");highlight(prefix,suffix,"pre")};
/*sh_javascript.min.js */
if(!this.sh_languages){this.sh_languages={}}sh_languages.javascript=[[[/\/\/\//g,"sh_comment",1],[/\/\//g,"sh_comment",7],[/\/\*\*/g,"sh_comment",8],[/\/\*/g,"sh_comment",9],[/\b(?:abstract|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|final|finally|for|function|goto|if|implements|in|instanceof|interface|native|new|null|private|protected|prototype|public|return|static|super|switch|synchronized|throw|throws|this|transient|true|try|typeof|var|volatile|while|with)\b/g,"sh_keyword",-1],[/(\+\+|--|\)|\])(\s*)(\/=?(?![*\/]))/g,["sh_symbol","sh_normal","sh_symbol"],-1],[/(0x[A-Fa-f0-9]+|(?:[\d]*\.)?[\d]+(?:[eE][+-]?[\d]+)?)(\s*)(\/(?![*\/]))/g,["sh_number","sh_normal","sh_symbol"],-1],[/([A-Za-z$_][A-Za-z0-9$_]*\s*)(\/=?(?![*\/]))/g,["sh_normal","sh_symbol"],-1],[/\/(?:\\.|[^*\\\/])(?:\\.|[^\\\/])*\/[gim]*/g,"sh_regexp",-1],[/\b[+-]?(?:(?:0x[A-Fa-f0-9]+)|(?:(?:[\d]*\.)?[\d]+(?:[eE][+-]?[\d]+)?))u?(?:(?:int(?:8|16|32|64))|L)?\b/g,"sh_number",-1],[/"/g,"sh_string",10],[/'/g,"sh_string",11],[/~|!|%|\^|\*|\(|\)|-|\+|=|\[|\]|\\|:|;|,|\.|\/|\?|&|<|>|\|/g,"sh_symbol",-1],[/\{|\}/g,"sh_cbracket",-1],[/\b(?:Math|Infinity|NaN|undefined|arguments)\b/g,"sh_predef_var",-1],[/\b(?:Array|Boolean|Date|Error|EvalError|Function|Number|Object|RangeError|ReferenceError|RegExp|String|SyntaxError|TypeError|URIError|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|isNaN|parseFloat|parseInt)\b/g,"sh_predef_func",-1],[/(?:[A-Za-z]|_)[A-Za-z0-9_]*(?=[ \t]*\()/g,"sh_function",-1]],[[/$/g,null,-2],[/(?:<?)[A-Za-z0-9_\.\/\-_~]+@[A-Za-z0-9_\.\/\-_~]+(?:>?)|(?:<?)[A-Za-z0-9_]+:\/\/[A-Za-z0-9_\.\/\-_~]+(?:>?)/g,"sh_url",-1],[/<\?xml/g,"sh_preproc",2,1],[/<!DOCTYPE/g,"sh_preproc",4,1],[/<!--/g,"sh_comment",5],[/<(?:\/)?[A-Za-z](?:[A-Za-z0-9_:.-]*)(?:\/)?>/g,"sh_keyword",-1],[/<(?:\/)?[A-Za-z](?:[A-Za-z0-9_:.-]*)/g,"sh_keyword",6,1],[/&(?:[A-Za-z0-9]+);/g,"sh_preproc",-1],[/<(?:\/)?[A-Za-z][A-Za-z0-9]*(?:\/)?>/g,"sh_keyword",-1],[/<(?:\/)?[A-Za-z][A-Za-z0-9]*/g,"sh_keyword",6,1],[/@[A-Za-z]+/g,"sh_type",-1],[/(?:TODO|FIXME|BUG)(?:[:]?)/g,"sh_todo",-1]],[[/\?>/g,"sh_preproc",-2],[/([^=" \t>]+)([ \t]*)(=?)/g,["sh_type","sh_normal","sh_symbol"],-1],[/"/g,"sh_string",3]],[[/\\(?:\\|")/g,null,-1],[/"/g,"sh_string",-2]],[[/>/g,"sh_preproc",-2],[/([^=" \t>]+)([ \t]*)(=?)/g,["sh_type","sh_normal","sh_symbol"],-1],[/"/g,"sh_string",3]],[[/-->/g,"sh_comment",-2],[/<!--/g,"sh_comment",5]],[[/(?:\/)?>/g,"sh_keyword",-2],[/([^=" \t>]+)([ \t]*)(=?)/g,["sh_type","sh_normal","sh_symbol"],-1],[/"/g,"sh_string",3]],[[/$/g,null,-2]],[[/\*\//g,"sh_comment",-2],[/(?:<?)[A-Za-z0-9_\.\/\-_~]+@[A-Za-z0-9_\.\/\-_~]+(?:>?)|(?:<?)[A-Za-z0-9_]+:\/\/[A-Za-z0-9_\.\/\-_~]+(?:>?)/g,"sh_url",-1],[/<\?xml/g,"sh_preproc",2,1],[/<!DOCTYPE/g,"sh_preproc",4,1],[/<!--/g,"sh_comment",5],[/<(?:\/)?[A-Za-z](?:[A-Za-z0-9_:.-]*)(?:\/)?>/g,"sh_keyword",-1],[/<(?:\/)?[A-Za-z](?:[A-Za-z0-9_:.-]*)/g,"sh_keyword",6,1],[/&(?:[A-Za-z0-9]+);/g,"sh_preproc",-1],[/<(?:\/)?[A-Za-z][A-Za-z0-9]*(?:\/)?>/g,"sh_keyword",-1],[/<(?:\/)?[A-Za-z][A-Za-z0-9]*/g,"sh_keyword",6,1],[/@[A-Za-z]+/g,"sh_type",-1],[/(?:TODO|FIXME|BUG)(?:[:]?)/g,"sh_todo",-1]],[[/\*\//g,"sh_comment",-2],[/(?:<?)[A-Za-z0-9_\.\/\-_~]+@[A-Za-z0-9_\.\/\-_~]+(?:>?)|(?:<?)[A-Za-z0-9_]+:\/\/[A-Za-z0-9_\.\/\-_~]+(?:>?)/g,"sh_url",-1],[/(?:TODO|FIXME|BUG)(?:[:]?)/g,"sh_todo",-1]],[[/"/g,"sh_string",-2],[/\\./g,"sh_specialchar",-1]],[[/'/g,"sh_string",-2],[/\\./g,"sh_specialchar",-1]]];
highlight(undefined, undefined, 'pre');

/*
 功能：生成目录的JS工具
 */

let BlogDirectory = {
    // 动态添加目录样式
    catalog_loadStyles: function (str) {
        let style = document.createElement("style");
        style.type = "text/css";
        try {
            style.innerHTML = str;
        } catch (ex) {
            style.styleSheet.cssText = str;
        }
        let head = document.getElementsByTagName('head')[0];
        head.appendChild(style)
    },

    // 获取元素位置，距浏览器左边界的距离（left）和距浏览器上边界的距离（top）
    getElementPosition: function (ele) {
        let topPosition = 0;
        let leftPosition = 0;
        while (ele) {
            topPosition += ele.offsetTop;
            leftPosition += ele.offsetLeft;
            ele = ele.offsetParent;
        }
        return {top: topPosition, left: leftPosition};
    },

    // 获取滚动条当前位置
    getScrollBarPosition: function () {
        return scrollBarPosition = document.body.scrollTop || document.documentElement.scrollTop;
    },

    // 移动滚动条，finalPos 为目的位置，internal 为移动速度
    moveScrollBar: function (finalpos, interval) {

        //若不支持此方法，则退出
        if (!window.scrollTo) {
            return false;
        }

        //窗体滚动时，禁用鼠标滚轮
        window.onmousewheel = function () {
            return false;
        };

        //清除计时
        if (document.body.movement) {
            clearTimeout(document.body.movement);
        }

        let currentpos = BlogDirectory.getScrollBarPosition();//获取滚动条当前位置

        let dist = 0;
        if (currentpos === finalpos) {//到达预定位置，则解禁鼠标滚轮，并退出
            window.onmousewheel = function () {
                return true;
            };
            return true;
        }
        if (currentpos < finalpos) {//未到达，则计算下一步所要移动的距离
            dist = Math.ceil((finalpos - currentpos) / 10);
            currentpos += dist;
        }
        if (currentpos > finalpos) {
            dist = Math.ceil((currentpos - finalpos) / 10);
            currentpos -= dist;
        }

        let scrTop = BlogDirectory.getScrollBarPosition();//获取滚动条当前位置
        window.scrollTo(0, currentpos);//移动窗口
        //若已到底部，则解禁鼠标滚轮，并退出
        if (BlogDirectory.getScrollBarPosition() === scrTop) {
            window.onmousewheel = function () {
                return true;
            };
            return true;
        }

        //进行下一步移动
        let repeat = "BlogDirectory.moveScrollBar(" + finalpos + "," + interval + ")";
        document.body.movement = setTimeout(repeat, interval);
    },

    htmlDecode: function (text) {
        let temp = document.createElement("div");
        temp.innerHTML = text;
        let output = temp.innerText || temp.textContent;
        temp = null;
        return output;
    },

    /*
     创建博客目录，
     id表示包含正文容器的 id，
     mt 和 st 分别表示主标题和次级标题的标签名称（如 H2、H3，大写或小写都可以！），
     interval 表示移动的速度
     */
    createBlogDirectory: function (id, a, b, c, d, e, f, interval) {
        //获取正文 id="maincontent" 的容器
        let target = document.getElementById(id);
        if (!target) return false;
        //获取正文容器中所有元素结点
        let nodes = target.getElementsByTagName("*");
        //创建博客目录的div容器
        let divSideBar = document.createElement('DIV');
        divSideBar.className = 'sideBar';
        divSideBar.setAttribute('id', 'sideBar');
        let divSideBarTab = document.createElement('DIV');
        divSideBarTab.setAttribute('id', 'sideBarTab');
        divSideBar.appendChild(divSideBarTab);
        let h2 = document.createElement('H2');
        divSideBarTab.appendChild(h2);
        let txt = document.createTextNode('目录导航');
        h2.appendChild(txt);
        let divSideBarContents = document.createElement('DIV');
        divSideBarContents.style.display = 'none';
        divSideBarContents.setAttribute('id', 'sideBarContents');
        divSideBar.appendChild(divSideBarContents);
        //创建自定义列表
        let dlist = document.createElement("dl");
        divSideBarContents.appendChild(dlist);
        let num = 0;//统计找到的mt和st
        a = a.toUpperCase();//转化成大写
        b = b.toUpperCase();//转化成大写
        c = c.toUpperCase();//转化成大写
        d = d.toUpperCase();//转化成大写
        e = e.toUpperCase();//转化成大写
        f = f.toUpperCase();//转化成大写
        //遍历所有元素结点
        for (let i = 0, len = nodes.length; i < len; i++) {
            if (nodes[i].nodeName === a || nodes[i].nodeName === b || nodes[i].nodeName === c) {
                //获取标题文本
                // innerHTML里面的内容可能有HTML标签，所以用正则表达式去除HTML的标签
                let nodetext = nodes[i].innerHTML.replace(/<\/?[^>]+>/g, "");
                nodetext = nodetext.replace(/[^>]+>/g, "");//替换掉所有的xxx>;
                nodetext = nodetext.replace(/&nbsp;/ig, "");//替换掉所有的&nbsp;
                nodetext = BlogDirectory.htmlDecode(nodetext);
                //插入锚        
                nodes[i].setAttribute("id", "blogTitle" + num);
                let item;
                switch (nodes[i].nodeName) {
                    case a:    //若为主标题 
                        item = document.createElement("dt");
                        item.style.textAlign = "center";
                        item.style.color = "#000";
                        item.style.font = "bold";
                        item.style.backgroundColor = "#aaa";
                        break;
                    case b:    //若为子标题
                        item = document.createElement("dt");
                        item.style.font = "bold";
                        break;
                    case  c:    //若为子标题
                        item = document.createElement("dd");
                        item.style.textIndent = "2em";
                        item.style.color = "#000";
                        break;
                    case  d:    //若为子标题
                        item = document.createElement("dd");
                        item.style.textIndent = "2em";
                        break;
                    case  e:    //若为子标题
                        item = document.createElement("dd");
                        item.style.textIndent = "3em";
                        break;
                    case  f:    //若为子标题
                        item = document.createElement("dd");
                        item.style.textIndent = "4em";
                        break;       /* */
                }

                //创建锚链接
                let itemtext = document.createTextNode(nodetext);
                item.appendChild(itemtext);
                item.setAttribute("name", num);
                item.onclick = function () {        //添加鼠标点击触发函数
                    let pos = BlogDirectory.getElementPosition(document.getElementById("blogTitle" + this.getAttribute("name")));
                    if (!BlogDirectory.moveScrollBar(pos.top, interval)) return false;
                };

                //将自定义表项加入自定义列表中
                dlist.appendChild(item);
                num++;
            }
        }

        if (num === 0) return false;
        /*鼠标进入时的事件处理*/
        divSideBarTab.onmouseenter = function () {
            divSideBarContents.style.display = 'block';
        };
        /*鼠标离开时的事件处理*/
        divSideBar.onmouseleave = function () {
            divSideBarContents.style.display = 'none';
        };

        document.body.appendChild(divSideBar);
        BlogDirectory.catalog_loadStyles(`
            #sideBar{
                font-size:12px;
                font-family:Arial, Helvetica, sans-serif;
                text-align:left;
                position:fixed;
                top:50px;
                right:0;
                width: auto;
                height: auto;
            }
            #sideBarTab{
                float:left;
                width:30px;
                border-right:none;
                text-align:center;
                background-color:rgba(0,0,0,.2);
            }
            #sideBarContents{
                float:left;
                overflow:auto;
                overflow-x:hidden;!important;
                width:200px;
                min-height:108px;
                max-height:460px;
                border:1px solid #e5e5e5;
                border-right:none;
                background:#dedede;
            }
            #sideBarContents dl{
                margin:0;
                padding:0;
            }
            #sideBarContents dt{
                margin-top:5px;
                margin-left:5px;
            }
            #sideBarContents dd, dt {
                cursor: pointer;
            }
            #sideBarContents dd:hover, dt:hover {
                color:#A7995A;
        }`);

    }
};

window.addEventListener("load", BlogDirectory.createBlogDirectory("maincontent", "h1", "h2", "h3", "h4", "h5", "h6", 20), false);