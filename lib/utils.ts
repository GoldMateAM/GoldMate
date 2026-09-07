export const AMD=new Intl.NumberFormat("hy-AM",{style:"currency",currency:"AMD",maximumFractionDigits:0});
export const USD=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});
export const gramsPerTroyOunce=31.1034768;
export function slugify(v:string){return v.toLowerCase().trim().replace(/[^a-z0-9\u0531-\u0587]+/g,"-").replace(/^-|-$/g,"")}
export function cls(...x:(string|false|null|undefined)[]){return x.filter(Boolean).join(" ")}
export function metalValue(weight:number,purity:number,fineGoldGramAMD:number){return weight*(purity/999)*fineGoldGramAMD}
