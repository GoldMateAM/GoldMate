export function Logo({compact=false}:{compact?:boolean}){
 return <div className={compact?"goldmate-brand compact":"goldmate-brand"}>
  <img src="/brand/goldmate-mark.png" alt="" className="goldmate-mark"/>
  <span className="goldmate-name"><b>GOLD</b>MATE</span>
 </div>
}
