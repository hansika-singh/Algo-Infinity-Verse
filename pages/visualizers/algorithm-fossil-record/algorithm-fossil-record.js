document.addEventListener('DOMContentLoaded', function(){ afrRenderAll(); });

function afrGenArr(){ let a=[]; for(let i=0;i<14;i++) a.push(Math.floor(Math.random()*90)+5); return a; }

function afrSelectionSort(input){
  let a=input.slice(), steps=[];
  for(let i=0;i<a.length;i++){
    let m=i;
    for(let j=i+1;j<a.length;j++){ steps.push({arr:a.slice(),hi:[m,j]}); if(a[j]<a[m]) m=j; }
    if(m!==i){ let t=a[i]; a[i]=a[m]; a[m]=t; steps.push({arr:a.slice(),hi:[i,m]}); }
  }
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrBubbleSort(input){
  let a=input.slice(), steps=[], n=a.length;
  for(let i=0;i<n-1;i++){
    let swapped=false;
    for(let j=0;j<n-1-i;j++){
      steps.push({arr:a.slice(),hi:[j,j+1]});
      if(a[j]>a[j+1]){ let t=a[j]; a[j]=a[j+1]; a[j+1]=t; steps.push({arr:a.slice(),hi:[j,j+1]}); swapped=true; }
    }
    if(!swapped) break;
  }
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrShellSort(input){
  let a=input.slice(), steps=[], n=a.length;
  for(let gap=Math.floor(n/2); gap>0; gap=Math.floor(gap/2)){
    for(let i=gap;i<n;i++){
      let tmp=a[i], j=i;
      while(j>=gap){
        steps.push({arr:a.slice(),hi:[j-gap,j]});
        if(a[j-gap]>tmp){ a[j]=a[j-gap]; steps.push({arr:a.slice(),hi:[j-gap,j]}); j-=gap; } else break;
      }
      a[j]=tmp;
    }
  }
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrQuickSort(input){
  let a=input.slice(), steps=[];
  function qs(lo,hi){
    if(lo>=hi) return;
    let p=a[hi], i=lo;
    for(let j=lo;j<hi;j++){
      steps.push({arr:a.slice(),hi:[j,hi]});
      if(a[j]<p){ let t=a[i]; a[i]=a[j]; a[j]=t; steps.push({arr:a.slice(),hi:[i,j]}); i++; }
    }
    let t2=a[i]; a[i]=a[hi]; a[hi]=t2; steps.push({arr:a.slice(),hi:[i,hi]});
    qs(lo,i-1); qs(i+1,hi);
  }
  qs(0,a.length-1);
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrHeapSort(input){
  let a=input.slice(), steps=[], n=a.length;
  function heapify(sz,i){
    let largest=i,l=2*i+1,r=2*i+2;
    if(l<sz){ steps.push({arr:a.slice(),hi:[l,largest]}); if(a[l]>a[largest]) largest=l; }
    if(r<sz){ steps.push({arr:a.slice(),hi:[r,largest]}); if(a[r]>a[largest]) largest=r; }
    if(largest!==i){ let t=a[i]; a[i]=a[largest]; a[largest]=t; steps.push({arr:a.slice(),hi:[i,largest]}); heapify(sz,largest); }
  }
  for(let i=Math.floor(n/2)-1;i>=0;i--) heapify(n,i);
  for(let k=n-1;k>0;k--){ let t2=a[0]; a[0]=a[k]; a[k]=t2; steps.push({arr:a.slice(),hi:[0,k]}); heapify(k,0); }
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrMergeSort(input){
  let a=input.slice(), steps=[];
  function ms(lo,hi){
    if(hi-lo<=0) return;
    let mid=Math.floor((lo+hi)/2);
    ms(lo,mid); ms(mid+1,hi);
    let tmp=[], i=lo, j=mid+1;
    while(i<=mid&&j<=hi){ steps.push({arr:a.slice(),hi:[i,j]}); if(a[i]<=a[j]) tmp.push(a[i++]); else tmp.push(a[j++]); }
    while(i<=mid) tmp.push(a[i++]);
    while(j<=hi) tmp.push(a[j++]);
    for(let x=0;x<tmp.length;x++) a[lo+x]=tmp[x];
    steps.push({arr:a.slice(),hi:[lo,hi]});
  }
  ms(0,a.length-1);
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrTimSort(input){
  let a=input.slice(), steps=[], n=a.length, RUN=4;
  function ins(lo,hi){
    for(let i=lo+1;i<=hi;i++){
      let key=a[i], j=i-1;
      while(j>=lo){
        steps.push({arr:a.slice(),hi:[j,j+1]});
        if(a[j]>key){ a[j+1]=a[j]; steps.push({arr:a.slice(),hi:[j,j+1]}); j--; } else break;
      }
      a[j+1]=key;
    }
  }
  for(let i=0;i<n;i+=RUN) ins(i,Math.min(i+RUN-1,n-1));
  function merge(lo,mid,hi){
    let tmp=[], x=lo, y=mid+1;
    while(x<=mid&&y<=hi){ steps.push({arr:a.slice(),hi:[x,y]}); if(a[x]<=a[y]) tmp.push(a[x++]); else tmp.push(a[y++]); }
    while(x<=mid) tmp.push(a[x++]);
    while(y<=hi) tmp.push(a[y++]);
    for(let k=0;k<tmp.length;k++) a[lo+k]=tmp[k];
    steps.push({arr:a.slice(),hi:[lo,hi]});
  }
  for(let size=RUN; size<n; size*=2){
    for(let lo=0; lo<n; lo+=2*size){
      let mid=Math.min(lo+size-1,n-1), hi=Math.min(lo+2*size-1,n-1);
      if(mid<hi) merge(lo,mid,hi);
    }
  }
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrCountingSort(input){
  let a=input.slice(), steps=[], max=Math.max.apply(null,a), count=new Array(max+1).fill(0);
  for(let v=0;v<a.length;v++) count[a[v]]++;
  let out=[];
  for(let i=0;i<=max;i++){
    while(count[i]-->0){
      out.push(i);
      steps.push({arr:out.concat(new Array(a.length-out.length).fill(0)),hi:[out.length-1]});
    }
  }
  steps.push({arr:out.slice(),hi:[]});
  return steps;
}

function afrRadixSort(input){
  let a=input.slice(), steps=[], max=Math.max.apply(null,a);
  for(let exp=1; Math.floor(max/exp)>0; exp*=10){
    let buckets=[]; for(let b=0;b<10;b++) buckets.push([]);
    for(let v=0;v<a.length;v++){ buckets[Math.floor(a[v]/exp)%10].push(a[v]); steps.push({arr:a.slice(),hi:[]}); }
    a=[].concat.apply([],buckets);
    steps.push({arr:a.slice(),hi:[]});
  }
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

function afrIntroSort(input){
  let a=input.slice(), steps=[];
  function ins(lo,hi){
    for(let i=lo+1;i<=hi;i++){
      let key=a[i], j=i-1;
      while(j>=lo){
        steps.push({arr:a.slice(),hi:[j,j+1]});
        if(a[j]>key){ a[j+1]=a[j]; steps.push({arr:a.slice(),hi:[j,j+1]}); j--; } else break;
      }
      a[j+1]=key;
    }
  }
  function qs(lo,hi){
    if(hi-lo<8){ if(hi>lo) ins(lo,hi); return; }
    let p=a[hi], i=lo;
    for(let j=lo;j<hi;j++){
      steps.push({arr:a.slice(),hi:[j,hi]});
      if(a[j]<p){ let t=a[i]; a[i]=a[j]; a[j]=t; steps.push({arr:a.slice(),hi:[i,j]}); i++; }
    }
    let t2=a[i]; a[i]=a[hi]; a[hi]=t2; steps.push({arr:a.slice(),hi:[i,hi]});
    qs(lo,i-1); qs(i+1,hi);
  }
  qs(0,a.length-1);
  steps.push({arr:a.slice(),hi:[]});
  return steps;
}

let afrData = [
  { key:'bubble', name:'Bubble Sort', year:1956, inventor:'Unknown / early CS folklore', oldName:'Selection Sort (naive)', oldFn:afrSelectionSort, fn:afrBubbleSort,
    problem:'Selection sort always scans the entire remaining unsorted region, even on data that\'s nearly sorted already — wasteful for real-world inputs.',
    impact:'Bubble sort added early termination: if a full pass makes no swaps, the array is already sorted — the first optimization of its kind.',
    complexity:{old:'O(n²)', new:'O(n²), O(n) best'}, op:100, np:90 },
  { key:'shell', name:'Shell Sort', year:1959, inventor:'Donald Shell', oldName:'Bubble Sort', oldFn:afrBubbleSort, fn:afrShellSort,
    problem:'Bubble sort only swaps neighbors, so an element far from its place needs many passes to migrate there.',
    impact:'Shell sort compares elements far apart using shrinking gaps, letting misplaced values jump long distances early — far fewer total moves.',
    complexity:{old:'O(n²)', new:'O(n log² n)'}, op:100, np:55 },
  { key:'quick', name:'Quicksort', year:1959, inventor:'Tony Hoare', oldName:'Shell Sort', oldFn:afrShellSort, fn:afrQuickSort,
    problem:'Gap-based insertion still did linear-ish work per element; no divide-and-conquer strategy existed yet for in-place sorting.',
    impact:'Quicksort recursively partitions around a pivot, hitting O(n log n) average time — it became the default sort in countless libraries for decades.',
    complexity:{old:'O(n log² n)', new:'O(n log n) avg'}, op:55, np:35 },
  { key:'heap', name:'Heapsort', year:1964, inventor:'J. W. J. Williams', oldName:'Quicksort', oldFn:afrQuickSort, fn:afrHeapSort,
    problem:'Quicksort\'s O(n²) worst case (bad pivot choices) was unacceptable where guaranteed performance mattered.',
    impact:'Heapsort sorts via a binary heap, guaranteeing O(n log n) in every case — no randomness, no worst-case blowup, ideal for real-time systems.',
    complexity:{old:'O(n log n) avg, O(n²) worst', new:'O(n log n) guaranteed'}, op:70, np:35 },
  { key:'merge', name:'Merge Sort', year:1945, inventor:'John von Neumann', oldName:'Heapsort', oldFn:afrHeapSort, fn:afrMergeSort,
    problem:'Heapsort is in-place but unstable, and its scattered heap access pattern is poor for CPU cache locality.',
    impact:'Merge sort is stable and predictable; its divide-and-conquer shape parallelizes naturally — the backbone of external sorting for huge datasets.',
    complexity:{old:'O(n log n)', new:'O(n log n), stable'}, op:35, np:32 },
  { key:'tim', name:'Timsort', year:2002, inventor:'Tim Peters', oldName:'Merge Sort', oldFn:afrMergeSort, fn:afrTimSort,
    problem:'Pure merge sort ignores existing order in real data — it always fully recurses even on already-sorted runs.',
    impact:'Timsort finds naturally sorted runs and merges them, using insertion sort for small runs — now powers Python\'s sort() and Java\'s Arrays.sort().',
    complexity:{old:'O(n log n)', new:'O(n) best, O(n log n) worst'}, op:35, np:20 },
  { key:'counting', name:'Counting Sort', year:1954, inventor:'Harold H. Seward', oldName:'Timsort', oldFn:afrTimSort, fn:afrCountingSort,
    problem:'Comparison-based sorts are fundamentally bounded by O(n log n) — no comparison sort can beat this lower bound.',
    impact:'Counting sort skips comparisons entirely by counting occurrences of each value — O(n+k) linear time when the value range k is small.',
    complexity:{old:'O(n log n)', new:'O(n + k)'}, op:35, np:18 },
  { key:'radix', name:'Radix Sort', year:1887, inventor:'Herman Hollerith', oldName:'Counting Sort', oldFn:afrCountingSort, fn:afrRadixSort,
    problem:'Counting sort needs a counting array sized to the max value — impractical when values span a huge range.',
    impact:'Radix sort applies counting sort digit-by-digit, handling huge value ranges in O(d·n) — used in punch-card tabulators and modern GPU sorts.',
    complexity:{old:'O(n + k)', new:'O(d·(n + k))'}, op:18, np:22 },
  { key:'intro', name:'Introsort', year:1997, inventor:'David Musser', oldName:'Radix Sort', oldFn:afrRadixSort, fn:afrIntroSort,
    problem:'Radix only works on fixed-width keys like integers — general comparison sorting still needed one sort with no worst-case blowup.',
    impact:'Introsort starts as quicksort, falls back to insertion sort on tiny partitions (and heapsort if recursion gets too deep) — what C++\'s std::sort() uses today.',
    complexity:{old:'O(d·(n + k))', new:'O(n log n) guaranteed'}, op:22, np:35 }
];

function afrRenderBars(id, arr, hi, max, done){
  let el = document.getElementById(id);
  if(!el) return;
  el.innerHTML = arr.map(function(v,i){
    let cls = 'afr-bar' + (done ? ' sorted' : (hi.indexOf(i)>-1 ? ' cmp' : ''));
    return '<div class="'+cls+'" style="height:'+(v/max*100)+'%"></div>';
  }).join('');
}

function afrRunCompare(key){
  let entry = afrData.filter(function(d){ return d.key===key; })[0];
  if(!entry) return;
  let arr = afrGenArr();
  let max = Math.max.apply(null, arr);
  let oldSteps = entry.oldFn(arr);
  let newSteps = entry.fn(arr);
  let oldElId='afrBarsOld-'+key, newElId='afrBarsNew-'+key;
  let oldStatEl=document.getElementById('afrStatOld-'+key), newStatEl=document.getElementById('afrStatNew-'+key);
  let btn=document.querySelector('.afr-run-btn[data-key="'+key+'"]');
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Running'; }
  let i=0, maxLen=Math.max(oldSteps.length,newSteps.length);
  let id=setInterval(function(){
    let oDone = i>=oldSteps.length-1, nDone = i>=newSteps.length-1;
    let os = oldSteps[Math.min(i,oldSteps.length-1)];
    let ns = newSteps[Math.min(i,newSteps.length-1)];
    afrRenderBars(oldElId, os.arr, os.hi, max, oDone);
    afrRenderBars(newElId, ns.arr, ns.hi, max, nDone);
    if(oldStatEl) oldStatEl.textContent = Math.min(i+1,oldSteps.length)+' / '+oldSteps.length+' ops';
    if(newStatEl) newStatEl.textContent = Math.min(i+1,newSteps.length)+' / '+newSteps.length+' ops';
    i++;
    if(i>=maxLen){
      clearInterval(id);
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-rotate-right"></i> Run Again'; }
    }
  }, 35);
}

function afrRenderAll(){
  let wrap = document.getElementById('afrContainer');
  let nav = document.getElementById('afrNav');
  if(!wrap) return;
  wrap.innerHTML = afrData.map(function(d, idx){
    let arr = afrGenArr();
    let max = Math.max.apply(null, arr);
    let barsHtml = arr.map(function(v){ return '<div class="afr-bar" style="height:'+(v/max*100)+'%"></div>'; }).join('');
    let card =
      '<div class="afr-fossil" id="afr-'+d.key+'">' +
        '<div class="afr-dot"></div>' +
        '<div class="afr-card">' +
          '<div class="afr-card-header">' +
            '<span class="afr-year">'+d.year+'</span>' +
            '<h3 class="afr-algo-name">'+d.name+'</h3>' +
            '<span class="afr-inventor">'+d.inventor+'</span>' +
          '</div>' +
          '<p class="afr-problem"><strong>Problem with predecessor:</strong> '+d.problem+'</p>' +
          '<div class="afr-compare">' +
            '<div class="afr-compare-col">' +
              '<div class="afr-compare-label">'+d.oldName+'</div>' +
              '<div class="afr-bars" id="afrBarsOld-'+d.key+'">'+barsHtml+'</div>' +
              '<div class="afr-compare-stat" id="afrStatOld-'+d.key+'">ready</div>' +
            '</div>' +
            '<div class="afr-vs">VS</div>' +
            '<div class="afr-compare-col">' +
              '<div class="afr-compare-label">'+d.name+'</div>' +
              '<div class="afr-bars" id="afrBarsNew-'+d.key+'">'+barsHtml+'</div>' +
              '<div class="afr-compare-stat" id="afrStatNew-'+d.key+'">ready</div>' +
            '</div>' +
          '</div>' +
          '<button class="btn afr-run-btn" data-key="'+d.key+'"><i class="fas fa-play"></i> Run Comparison</button>' +
          '<div class="afr-complexity">' +
            '<div class="afr-complexity-row"><span>'+d.oldName+'</span><div class="afr-complexity-bar"><div class="afr-complexity-fill" style="width:'+d.op+'%"></div></div><span>'+d.complexity.old+'</span></div>' +
            '<div class="afr-complexity-row"><span>'+d.name+'</span><div class="afr-complexity-bar"><div class="afr-complexity-fill afr-fill-new" style="width:'+d.np+'%"></div></div><span>'+d.complexity.new+'</span></div>' +
          '</div>' +
          '<p class="afr-impact"><i class="fas fa-bolt"></i> <strong>Real-world impact:</strong> '+d.impact+'</p>' +
        '</div>' +
      '</div>';
    if(idx<afrData.length-1) card += '<div class="afr-arrow"><i class="fas fa-arrow-down"></i></div>';
    return card;
  }).join('');

  if(nav){
    nav.innerHTML = afrData.map(function(d){ return '<button class="afr-nav-btn" data-target="afr-'+d.key+'">'+d.name+'</button>'; }).join('');
    nav.querySelectorAll('.afr-nav-btn').forEach(function(b){
      b.addEventListener('click', function(){
        let t = document.getElementById(b.getAttribute('data-target'));
        if(t) t.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
  }

  wrap.querySelectorAll('.afr-run-btn').forEach(function(b){
    b.addEventListener('click', function(){ afrRunCompare(b.getAttribute('data-key')); });
  });
}