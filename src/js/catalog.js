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