(function(root){
function elementary(row,rule,wrap=false){return row.map((_,i)=>{const get=j=>wrap?row[(j+row.length)%row.length]:(row[j]||0);return (rule>>(4*get(i-1)+2*get(i)+get(i+1)))&1;});}
function life(board,w,h,wrap=true){return board.map((v,i)=>{let n=0,x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let a=x+dx,b=y+dy;if(wrap){a=(a+w)%w;b=(b+h)%h;}if(a>=0&&a<w&&b>=0&&b<h)n+=board[b*w+a];}return +(n===3||(v===1&&n===2));});}
const api={elementary,life};root.CA=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
