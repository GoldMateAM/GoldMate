export type Locale="hy"|"en"|"ru";
export type UserRole="buyer"|"seller"|"admin";
export type I18nText={hy:string;en:string;ru:string};
export type AppUser={id:string;displayName:string;email:string;photoURL?:string;phone?:string;role:UserRole;sellerApproved:boolean;locale:Locale;createdAt?:any};
export type Brand={id:string;ownerId:string;name:string;slug:string;logoURL?:string;coverURL?:string;bio:I18nText;phone?:string;whatsapp?:string;instagram?:string;address?:string;status:"pending"|"active"|"suspended";verified?:boolean;createdAt?:any};
export type Product={id:string;sellerId:string;brandId:string;title:I18nText;description:I18nText;category:string;color:"yellow"|"white"|"rose"|"mixed";purity:585|750|900|916|958|995|999;;weightGrams:number;priceAMD:number;compareAtAMD?:number;sku?:string;stock:number;size?:string;condition:"new"|"preowned";gemstone?:string;stoneCt?:number;images:string[];status:"draft"|"active"|"sold"|"archived";featured?:boolean;createdAt?:any};
export type VaultItem={id:string;name:string;category:string;color:string;purity:number;weightGrams:number;purchasePriceAMD:number;purchaseDate:string;acquiredFrom?:string;notes?:string;images:string[];sharedEmails:string[];createdAt?:any};
