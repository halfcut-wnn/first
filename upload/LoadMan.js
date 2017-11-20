//更改js
function LoadMan(options){
        //arguments
        var target=options.target,
            refreshFn=options.refreshFn,
            loadMoreFn=options.loadMoreFn;

        //缓存全局变量
        var win=window,
            doc=win.document,
            body=doc.body;

        //dom名称
        var REFRESH_NAME='refresh',
            LOADMORE_NAME='loadMore',
            NOMORE_NAME='noMore';

        //touch事件相关参数
        var _startY= 0,
            _endY= 0,
            _top= 0,
            _MOVE_Y=10,//滑动距离小于该数值为误触
            _isMoving=false;//识别误触

        //数据加载相关参数
        var _isLoading=false,
            _hasMore=true;

        //重置touch事件相关参数
        function resetParam(){
            _startY=0;
            _endY=0;
            _isMoving=false;
        }

        //处理touchstart事件
        function _startHandler(evt){
            if(_isLoading){
                return false;
            }
            _startY=evt.targetTouches[0].pageY;

            //若所需展现dom不存在则创建并添加
            if(!_elRefresh){
                _elRefresh=doc.createElement('div');
                _elRefresh.style.cssText='display:none;background-color:#333;text-align:center;color:#FFF;padding:20px 0;';
                _elRefresh.id=REFRESH_NAME;
                target.insertBefore(_elRefresh,target.firstChild);
            }
            if(!_elLoadMore){
                _elLoadMore=doc.createElement('div');
                _elLoadMore.style.cssText='display:none;background-color:#333;text-align:center;color:#FFF;padding:20px 0;';
                _elLoadMore.id=LOADMORE_NAME;
                target.appendChild(_elLoadMore);
            }
            if(!_elNoMore){
                _elNoMore=doc.createElement('div');
                _elNoMore.style.cssText='display:none;text-align:center;padding:10px 0;';
                _elNoMore.id=NOMORE_NAME;
                _elNoMore.innerText='没有更多数据了！';
                target.appendChild(_elNoMore);
            }
        }

        //处理touchmove事件，处理上拉下拉动态效果
        var _HEIGHT=50,
            _offset= 0,
            _height= 0,
            _elRefresh=null,
            _elLoadMore=null,
            _elNoMore=null;
        function _moveHandler(evt){
            if(!_isMoving && _isLoading){
                return false;
            }
            _top=body.scrollTop;
            _endY=evt.targetTouches[0].pageY;
            Math.abs(_startY - _endY ) > _MOVE_Y && (_isMoving=true);

            //上拉
            if(_startY > _endY && _hasMore){
                _elLoadMore.style.display='block';
                _elLoadMore.innerHTML='上拉加载更多';
            }

            //顶部下拉
            if(_top<=0 && _startY < _endY){
                evt.preventDefault();
                _offset=_endY-_startY;
                if(_offset <= _HEIGHT){
                    _height=0.2 * _HEIGHT+0.8*_offset;
                    _elRefresh.innerHTML='下拉刷新';
                }else if(_offset > _HEIGHT){
                    _height=_HEIGHT + 0.2*_offset;
                    _elRefresh.innerHTML='释放更新';
                }
                _elRefresh.style.height= _height +'px';
                _elRefresh.style.display='block';
            }
        }

        //处理touchend事件
        function _endHandler(evt){
            if(!_isMoving && _isLoading){
                return false;
            }

            if(evt.type==='touchend'){
                //上拉加载
                if(_startY > _endY ){
                    _loadMore(evt);
                }

                //下拉刷新
                if(_top<=0 && _startY < _endY){
                    _refresh(evt);
                }
            }else{
                //针对android touchend不触发bug，只需处理上拉加载
                //此方法下，采用预加载的方式，当_scrollBottom小于定值时，触发加载
                //上拉加载 TODO _scrollBottom计算方法待修正
                var _scrollBottom=body.scrollHeight - win.screen.availHeight - (win.screenTop || body.scrollTop),
                    _THRESHOLD=10;
                if(_scrollBottom < _THRESHOLD){
                    _loadMore(evt);
                }
            }
        }

        //刷新数据
        function _refresh(evt){
            if(_isLoading){
                return false;
            }
            _isLoading=true;
            _hasMoreData(true);
            resetParam();
            refreshFn();
            _elRefresh.innerHTML='加载中...';
            _elRefresh.style.height=_HEIGHT+'px';
        }

        //加载更多数据
        function _loadMore(evt){
            if(_isLoading || !_hasMore){
                return false;
            }
            _isLoading=true;
            resetParam();
            loadMoreFn();
            _elLoadMore.innerHTML='加载中...';
        }

        //数据加载完成后的处理
        function _loadEnd(){
            _isLoading=false;
            _elRefresh && (_elRefresh.style.display='none');
            _elLoadMore && (_elLoadMore.style.display='none');
        }

        //没有更多数据
        function _hasMoreData(flag){
            if(flag){
                _hasMore=true;
                _elNoMore.style.display='none';
            }else{
                _hasMore=false;
                _elNoMore.style.display='block';
            }
        }

        function _init(){
            common.Event.addEvent(doc,'touchstart',function(evt){
                _startHandler(evt);
            });

            common.Event.addEvent(doc,'touchmove',function(evt){
                _moveHandler(evt);
            });

            common.Event.addEvent(doc,'touchend',function(evt){
                _endHandler(evt);
            });

            //针对android touchend不触发bug
            common.Event.addEvent(doc,'touchcancel',function(evt){
                _endHandler(evt);
            });

            //自定义事件，数据加载完后触发
            common.Event.addEvent(doc,'loadend',function(){
                _loadEnd();
            });

            //自定义事件，没有更多数据时触发
            common.Event.addEvent(doc,'nomoredata',function(){
                _hasMoreData();
            });
        }

        _init();
    }

    LoadMan.prototype.loadEnd=function(){
        var _evt = document.createEvent("HTMLEvents");
        _evt.initEvent("loadend", false, false);
        document.dispatchEvent(_evt);
    };
    LoadMan.prototype.noMoreData=function(){
        var _evt = document.createEvent("HTMLEvents");
        _evt.initEvent("nomoredata", false, false);
        document.dispatchEvent(_evt);
    };
