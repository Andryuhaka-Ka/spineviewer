// Spine 4.1 binary parser
const fs = require('fs');
const data = new Uint8Array(fs.readFileSync('./example/symbolsSP/symbols.skel'));
const dv = new DataView(data.buffer);
let idx = 0;
const readByte = () => dv.getInt8(idx++);
const readUByte = () => dv.getUint8(idx++);
const readInt32 = () => { const v = dv.getInt32(idx); idx += 4; return v; };
const readFloat = () => { const v = dv.getFloat32(idx); idx += 4; return v; };
const readBool = () => readByte() !== 0;
const readVarInt = (opt) => {
  let b = readByte(), r = b & 127;
  if (b & 128) { b = readByte(); r |= (b & 127) << 7;
    if (b & 128) { b = readByte(); r |= (b & 127) << 14;
      if (b & 128) { b = readByte(); r |= (b & 127) << 21;
        if (b & 128) { b = readByte(); r |= (b & 127) << 28; } } } }
  return opt ? r : (r >>> 1 ^ -(r & 1));
};
const strings = [];
const readStringRef = () => { const i = readVarInt(true); return i === 0 ? null : strings[i-1]; };
const readString = () => {
  let bc = readVarInt(true);
  if (bc === 0) return null;
  if (bc === 1) return '';
  bc--;
  let chars = '';
  for (let i = 0; i < bc;) {
    const b = readUByte();
    if ((b >> 4) === 12 || (b >> 4) === 13) { chars += String.fromCharCode((b & 31) << 6 | readByte() & 63); i += 2; }
    else if ((b >> 4) === 14) { chars += String.fromCharCode((b & 15) << 12 | (readByte() & 63) << 6 | readByte() & 63); i += 3; }
    else { chars += String.fromCharCode(b); i++; }
  }
  return chars;
};
const skipBezier = (n) => { for(let i=0;i<n*4;i++) readFloat(); };

readInt32(); readInt32(); readString();
readFloat(); readFloat(); readFloat(); readFloat();
const nonessential = readBool();
if (nonessential) { readFloat(); readString(); readString(); }
const strCount = readVarInt(true);
for (let i = 0; i < strCount; i++) strings.push(readString());

const bones = [];
const boneCount = readVarInt(true);
for (let i = 0; i < boneCount; i++) {
  const name = readString();
  const parentIdx = i === 0 ? -1 : readVarInt(true);
  const rotation = readFloat();
  const bx = readFloat(), by = readFloat();
  const scaleX = readFloat(), scaleY = readFloat();
  readFloat(); readFloat();
  const length = readFloat();
  const transformMode = readVarInt(true);
  const skinRequired = readBool();
  if (nonessential) readInt32();
  bones.push({ name, parentIdx, transformMode, skinRequired, rotation, x: bx, y: by, scaleX, scaleY, length });
}

const slotCount = readVarInt(true);
for (let i = 0; i < slotCount; i++) {
  readString(); readVarInt(true); readInt32(); readInt32(); readStringRef(); readVarInt(true);
}

const ikCount = readVarInt(true);
const ikNames = [];
for (let i = 0; i < ikCount; i++) {
  ikNames.push(readString());
  readVarInt(true); readBool();
  const bn = readVarInt(true); for (let j=0;j<bn;j++) readVarInt(true);
  readVarInt(true); readFloat(); readFloat(); readByte(); readBool(); readBool(); readBool();
}

const tcCount = readVarInt(true);
const tcNames = [];
for (let i = 0; i < tcCount; i++) {
  tcNames.push(readString());
  readVarInt(true); readBool();
  const bn = readVarInt(true); for (let j=0;j<bn;j++) readVarInt(true);
  readVarInt(true); readBool(); readBool();
  for (let j=0;j<9;j++) readFloat();
}

const pcCount = readVarInt(true);
const pcNames = [];
for (let i = 0; i < pcCount; i++) {
  pcNames.push(readString());
  readVarInt(true); readBool();
  const bn = readVarInt(true); for (let j=0;j<bn;j++) readVarInt(true);
  readVarInt(true); readVarInt(true); readVarInt(true); readVarInt(true);
  readFloat(); readFloat(); readFloat(); readFloat(); readFloat(); readFloat();
}

const skipSeq = () => { const h=readBool(); if(!h) return; readVarInt(true);readVarInt(true);readVarInt(true);readVarInt(true); };
const skipVerts = (vc) => {
  const w=readBool();
  if(!w){for(let i=0;i<vc*2;i++) readFloat();return;}
  for(let i=0;i<vc;i++){const bc=readVarInt(true);for(let j=0;j<bc;j++){readVarInt(true);readFloat();readFloat();readFloat();}}
};
const skipAtt = (type) => {
  if(type===0){readStringRef();readFloat();readFloat();readFloat();readFloat();readFloat();readFloat();readFloat();readInt32();skipSeq();}
  else if(type===1){skipVerts(readVarInt(true));if(nonessential)readInt32();}
  else if(type===2){readStringRef();readInt32();const vc=readVarInt(true);for(let i=0;i<vc*2;i++)readFloat();const tn=readVarInt(true);for(let i=0;i<tn;i++){readByte();readByte();}skipVerts(vc);readVarInt(true);skipSeq();if(nonessential){const en=readVarInt(true);for(let i=0;i<en;i++){readByte();readByte();}readFloat();readFloat();}}
  else if(type===3){readStringRef();readInt32();readVarInt(true);readStringRef();readBool();skipSeq();if(nonessential){readFloat();readFloat();}}
  else if(type===4){readBool();readBool();const vc=readVarInt(true);skipVerts(vc);const lc=Math.floor(vc/3);for(let i=0;i<lc;i++)readFloat();if(nonessential)readInt32();}
  else if(type===5){readFloat();readFloat();readFloat();if(nonessential)readInt32();}
  else if(type===6){readVarInt(true);skipVerts(readVarInt(true));if(nonessential)readInt32();}
  else { throw new Error('Unknown att type: ' + type + ' at pos ' + idx); }
};
const skipSkinSlots = (sc) => {
  for(let i=0;i<sc;i++){readVarInt(true);const an=readVarInt(true);for(let j=0;j<an;j++){readStringRef();readStringRef();skipAtt(readUByte());}}
};
skipSkinSlots(readVarInt(true));
const namedSkinCount = readVarInt(true);
for(let i=0;i<namedSkinCount;i++){
  readStringRef();
  const bc=readVarInt(true); for(let j=0;j<bc;j++) readVarInt(true);
  const ic=readVarInt(true); for(let j=0;j<ic;j++) readVarInt(true);
  const tc=readVarInt(true); for(let j=0;j<tc;j++) readVarInt(true);
  const pc=readVarInt(true); for(let j=0;j<pc;j++) readVarInt(true);
  skipSkinSlots(readVarInt(true));
}

const evCount = readVarInt(true);
const eventNames = [];
for(let i=0;i<evCount;i++){
  eventNames.push(readStringRef());
  readVarInt(false); readFloat(); readString();
  const ap=readString(); if(ap){readFloat();readFloat();}
}

const skipTl1 = (fc) => {
  readFloat(); readFloat();
  for(let f=0;f<fc-1;f++){ readFloat(); readFloat(); const ct=readByte(); if(ct===2) skipBezier(1); }
};
const skipTl2 = (fc) => {
  readFloat(); readFloat(); readFloat();
  for(let f=0;f<fc-1;f++){ readFloat(); readFloat(); readFloat(); const ct=readByte(); if(ct===2) skipBezier(2); }
};

const animCount = readVarInt(true); console.log('animCount:', animCount, 'at pos:', idx);
const boneTimelines = {};
const allAnimNames = [];

for(let ai=0;ai<animCount;ai++){
  const animName=readString(); allAnimNames.push(animName);
  readVarInt(true);
  const p0=idx;

  for(let i=0,sc=readVarInt(true);i<sc;i++){
    readVarInt(true);
    for(let ii=0,tlc=readVarInt(true);ii<tlc;ii++){
      const type=readByte(), fc=readVarInt(true), fl=fc-1;
      if(type===0){ for(let f=0;f<fc;f++){readFloat();readStringRef();} }
      else if(type===1){ readVarInt(true); readFloat();readUByte();readUByte();readUByte();readUByte(); for(let f=0;f<fl;f++){readFloat();readUByte();readUByte();readUByte();readUByte(); const ct=readByte(); if(ct===2) skipBezier(4);} }
      else if(type===2){ readVarInt(true); readFloat();readUByte();readUByte();readUByte(); for(let f=0;f<fl;f++){readFloat();readUByte();readUByte();readUByte(); const ct=readByte(); if(ct===2) skipBezier(3);} }
      else if(type===3){ readVarInt(true); readFloat();readUByte();readUByte();readUByte();readUByte();readUByte();readUByte();readUByte(); for(let f=0;f<fl;f++){readFloat();readUByte();readUByte();readUByte();readUByte();readUByte();readUByte();readUByte(); const ct=readByte(); if(ct===2) skipBezier(7);} }
      else if(type===4){ readVarInt(true); readFloat();readUByte();readUByte();readUByte();readUByte();readUByte();readUByte(); for(let f=0;f<fl;f++){readFloat();readUByte();readUByte();readUByte();readUByte();readUByte();readUByte(); const ct=readByte(); if(ct===2) skipBezier(6);} }
      else if(type===5){ readVarInt(true); readFloat();readUByte(); for(let f=0;f<fl;f++){readFloat();readUByte(); const ct=readByte(); if(ct===2) skipBezier(1);} }
      else { throw new Error('Unknown slot tl type: '+type+' at '+idx); }
    }
  }

  console.log(' ['+animName+'] after slot tl pos:', idx, 'consumed:', idx-p0);
  for(let i=0,btc=readVarInt(true);i<btc;i++){
    const bi=readVarInt(true);
    if(!boneTimelines[bi])boneTimelines[bi]=new Set();
    boneTimelines[bi].add(animName);
    for(let ii=0,tlc=readVarInt(true);ii<tlc;ii++){
      const type=readByte(), fc=readVarInt(true);
      readVarInt(true);
      if(type===0||type===2||type===3||type===5||type===6||type===8||type===9) skipTl1(fc);
      else skipTl2(fc);
    }
  }

  console.log(' ['+animName+'] after bone tl pos:', idx);
  for(let i=0,n=readVarInt(true);i<n;i++){
    readVarInt(true); const fc=readVarInt(true); readVarInt(true);
    readFloat();readFloat();readFloat();
    for(let f=0;f<fc;f++){
      readByte();readBool();readBool();
      if(f===fc-1) break;
      readFloat();readFloat();readFloat();
      const ct=readByte(); if(ct===2) skipBezier(2);
    }
  }

  console.log(' ['+animName+'] after IK tl pos:', idx);
  for(let i=0,n=readVarInt(true);i<n;i++){
    readVarInt(true); const fc=readVarInt(true); readVarInt(true);
    readFloat();readFloat();readFloat();readFloat();readFloat();readFloat();readFloat();
    for(let f=0;f<fc-1;f++){
      readFloat();readFloat();readFloat();readFloat();readFloat();readFloat();readFloat();
      const ct=readByte(); if(ct===2) skipBezier(6);
    }
  }

  console.log(' ['+animName+'] after TC tl pos:', idx);
  for(let i=0,n=readVarInt(true);i<n;i++){
    readVarInt(true); // constraint index
    for(let ii=0,m=readVarInt(true);ii<m;ii++){
      const type=readByte(); const fc=readVarInt(true); readVarInt(true); // bezierCount
      if(type===0||type===1){ skipTl1(fc); }
      else { readFloat();readFloat();readFloat();readFloat(); for(let f=0;f<fc-1;f++){readFloat();readFloat();readFloat();readFloat(); const ct=readByte(); if(ct===2) skipBezier(3);} }
    }
  }

  console.log(' ['+animName+'] after Path tl pos:', idx);
  {const dn=readVarInt(true);console.log(' ['+animName+'] deform count:', dn, 'at', idx);
  for(let i=0;i<dn;i++){
    readVarInt(true);
    for(let ii=0,sc=readVarInt(true);ii<sc;ii++){
      readVarInt(true);
      for(let iii=0,ac=readVarInt(true);iii<ac;iii++){
        readStringRef();
        const tlType=readByte(); const fc2=readVarInt(true);
        if(tlType===1){ for(let f=0;f<fc2;f++){readFloat();readInt32();readFloat();} }
        else {
          readVarInt(true); readFloat();
          const e0=readVarInt(true); if(e0>0){readVarInt(true);for(let v=0;v<e0;v++)readFloat();}
          for(let f=0;f<fc2-1;f++){
            readFloat();
            const e=readVarInt(true); if(e>0){readVarInt(true);for(let v=0;v<e;v++)readFloat();}
            const ct=readByte(); if(ct===2) skipBezier(1);
          }
        }
      }
    }
  }}

  {const en=readVarInt(true);console.log(' ['+animName+'] event count:', en, 'at', idx);
  for(let i=0;i<en;i++){
    const fc2=readVarInt(true);
    for(let f=0;f<fc2;f++){
      readFloat(); readVarInt(true); const flags=readByte();
      if(flags&1) readVarInt(false);
      if(flags&2) readFloat();
      if(flags&4) readString();
      if(flags&8){readFloat();readFloat();}
    }
  }}

  {const dotTlc=readVarInt(true); console.log(' ['+animName+'] draworder count:', dotTlc, 'at', idx);
  for(let i=0;i<dotTlc;i++){
    readFloat();
    const oc=readVarInt(true);
    for(let j=0;j<oc;j++){readVarInt(true);readVarInt(true);}
  }
  console.log(' ['+animName+'] END pos:', idx);}
}

console.log('=== PARSE COMPLETE ===');
console.log('Position:', idx, '/', data.length, '(remaining:', data.length-idx, ')');
console.log('Animations ('+allAnimNames.length+'):', allAnimNames.join(', '));
if(ikNames.length) console.log('IK:', ikNames.join(', '));
if(tcNames.length) console.log('TC:', tcNames.join(', '));
if(pcNames.length) console.log('PC:', pcNames.join(', '));
if(eventNames.length) console.log('Events:', eventNames.join(', '));
console.log('');
const tmNames=['Normal','OnlyTranslation','NoRotOrRefl','NoScale','NoScaleOrRefl'];
bones.forEach((b, i) => {
  const anims = boneTimelines[i];
  const animStr = anims && anims.size > 0 ? 'IN: '+[...anims].join(', ') : '<<< NO KEYFRAMES >>>';
  const parent = b.parentIdx >= 0 ? bones[b.parentIdx].name : 'ROOT';
  const tm = tmNames[b.transformMode] || b.transformMode;
  console.log((anims?'ANIM  ':'NOKEY ') + '['+i+'] '+b.name+
    ' (parent='+parent+', tm='+tm+', skinReq='+b.skinRequired+
    ', x='+b.x.toFixed(1)+', y='+b.y.toFixed(1)+', rot='+b.rotation.toFixed(1)+')  '+animStr);
});
