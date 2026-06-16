export function findMissingSkills(text){

const skills=[
"React",
"Node",
"SQL",
"Git",
"Python"
];


return skills.filter(skill=>
!text.toLowerCase()
.includes(skill.toLowerCase())
);


}