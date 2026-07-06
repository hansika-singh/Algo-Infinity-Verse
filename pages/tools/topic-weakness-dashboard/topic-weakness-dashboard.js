/*
 Topic Wise Weakness Detection System

 Data format:
 topic:{
    solved,
    attempts,
    time
 }

 Later replace this data with
 actual user problem history.
*/


let topicData = {};

try {
    topicData = JSON.parse(localStorage.getItem("topicPerformance")) || {};
} catch (e) {
    topicData = {};
}



/*
 Default demo data
*/

if(!topicData || Object.keys(topicData).length === 0){


topicData = {


    Arrays:{
        solved:85,
        attempts:100,
        time:120
    },


    Trees:{
        solved:70,
        attempts:100,
        time:180
    },


    Graphs:{
        solved:40,
        attempts:100,
        time:250
    },


    DynamicProgramming:{
        solved:55,
        attempts:100,
        time:220
    },


    Searching:{
        solved:90,
        attempts:100,
        time:90
    }


};


localStorage.setItem(
    "topicPerformance",
    JSON.stringify(topicData)
);


}




function calculateScore(data){

    return Math.round(
        (data.solved / data.attempts) * 100
    );

}




function getStatus(score){


    if(score >= 80){

        return "Strong";

    }


    else if(score >= 60){

        return "Average";

    }


    else{

        return "Weak";

    }


}





function getRecommendation(topic,score){


    if(score < 60){

        return `
        Practice more ${topic} problems.
        Focus on concepts and revise mistakes.
        `;

    }


    else if(score < 80){

        return `
        Keep practicing ${topic}
        to improve accuracy.
        `;

    }


    else{

        return `
        Excellent performance.
        Try advanced ${topic} problems.
        `;

    }

}





function loadDashboard(){


const container =
document.getElementById("topicContainer");



let strong=0;
let average=0;
let weak=0;



container.innerHTML="";



for(let topic in topicData){



let score =
calculateScore(topicData[topic]);



let status =
getStatus(score);



if(status==="Strong")
strong++;

else if(status==="Average")
average++;

else
weak++;




container.innerHTML += `


<div class="topic-card">


<h3>${topic}</h3>


<p>
Accuracy : ${score}%
</p>



<div class="progress">

<div 
class="progress-bar"
style="width:${score}%">

</div>

</div>



<p class="status ${status.toLowerCase()}">
${status}
</p>





</div>


`;



}



document.getElementById("strongCount").innerText =
strong;


document.getElementById("averageCount").innerText =
average;


document.getElementById("weakCount").innerText =
weak;



}

function showRecommendations(){

    let list = document.getElementById("recommendationList");

    if(!list) return;

    list.innerHTML = "";

    for(let topic in topicData){

        let score = calculateScore(topicData[topic]);

        if(score < 60){

            list.innerHTML += `
                <div class="recommendation">
                    Practice more ${topic} problems. Focus on concepts and revise mistakes.
                </div>
            `;
        }
    }
}


loadDashboard();
showRecommendations();
