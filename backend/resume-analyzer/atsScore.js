export function calculateATS(text){

const keywords=[
"javascript",
"python",
"react",
"node",
"sql",
"html",
"css",
"github",
"machine learning"
];


let score=0;


keywords.forEach(word=>{

if(text.toLowerCase().includes(word)){
score+=10;
}

});


return Math.min(score,100);

}