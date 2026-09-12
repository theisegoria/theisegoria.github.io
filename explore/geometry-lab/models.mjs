export const triangle = ({b,h,x}) => ({area:b*h/2,perimeter:b+Math.hypot(x,h)+Math.hypot(b-x,h),left:Math.hypot(x,h),right:Math.hypot(b-x,h)});
export const pythagoras = ({a,b}) => ({c:Math.hypot(a,b),a2:a*a,b2:b*b,c2:a*a+b*b});
export const sector = ({r,angle}) => { const theta=angle*Math.PI/180; return {theta,arc:r*theta,area:r*r*theta/2,chord:2*r*Math.sin(theta/2)}; };
export const polygon = ({n,r}) => ({side:2*r*Math.sin(Math.PI/n),apothem:r*Math.cos(Math.PI/n),perimeter:2*n*r*Math.sin(Math.PI/n),area:n*r*r*Math.sin(2*Math.PI/n)/2});
export const cone = ({r,h}) => { const slant=Math.hypot(r,h);return {slant,volume:Math.PI*r*r*h/3,curved:Math.PI*r*slant,total:Math.PI*r*(slant+r)}; };
export const solids = ({r,h}) => ({h,cylinder:Math.PI*r*r*h,sphere:4*Math.PI*r*r*r/3,volumeRatio:4*r/(3*h)});
export const scale = ({k}) => ({length:k,area:k*k,volume:k*k*k});
