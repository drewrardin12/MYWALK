(function(root){
  function equal(a,b) {
    if(a===b)return true;
    if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
    const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&equal(a[k],b[k]));
  }
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  // Arrays are deliberately atomic: legacy lists use positional IDs.
  // Guessing how to merge them could attach progress to the wrong entry.
  function merge(base, local, remote, path='') {
    if(equal(local,remote)) return {data:local, conflicts:[]};
    if(equal(local,base)) return {data:remote, conflicts:[]};
    if(equal(remote,base)) return {data:local, conflicts:[]};
    if(object(local) && object(remote) && (object(base) || base === undefined)) {
      const data={}, conflicts=[];
      for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])) {
        const result=merge(base?.[key],local[key],remote[key],path?path+'.'+key:key);
        if(result.data!==undefined) data[key]=result.data;
        conflicts.push(...result.conflicts);
      }
      return {data,conflicts};
    }
    return {data:local, conflicts:[path]};
  }
  root.MyWalkMerge={merge,equal};
})(globalThis);
