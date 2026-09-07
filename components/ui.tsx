export function Stat({label,value,sub}:{label:string;value:string;sub?:string}){return <div className="stat"><span>{label}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>}
export function Empty({text}:{text:string}){return <div className="empty">{text}</div>}
