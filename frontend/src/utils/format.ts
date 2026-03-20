export function formatNumber(value:number|null|undefined):string{
      if(value == null)return '-';
      return value.toLocaleString();
}

export function formatDate(isostring:string):string{
      if(!isostring)return '-';
      return new Date(isostring).toLocaleString();
}