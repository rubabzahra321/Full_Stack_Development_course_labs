
let queue = [];

const buttons = document.querySelectorAll(".btn");
const queueBox = document.getElementById("queue");
const msg = document.getElementById("msg");

buttons.forEach(button => {

    button.addEventListener("click", function(){

        queue.push(this.innerText);

        showQueue();
    });

});

function showQueue(){

    queueBox.innerHTML = "";

    for(let i = 0; i < queue.length; i++){

        queueBox.innerHTML +=
        `<div class="item">${queue[i]}</div>`;
    }
}

document.addEventListener("click", function(e){

    if(e.target.classList.contains("item")){

        if(queue.length == 0){

            msg.innerText = "Queue Underflow";
            return;
        }

        queue.shift();

        msg.innerText = "Element Dequeued";

        showQueue();
    }
});

```
let queue = [];

$(".btn").click(function(){

    queue.push($(this).text());

    showQueue();
});

function showQueue(){

    $("#queue").html("");

    for(let i = 0; i < queue.length; i++){

        $("#queue").append(
            "<div class='item'>" + queue[i] + "</div>"
        );
    }
}

$(document).on("click",".item",function(){

    if(queue.length == 0){

        $("#msg").text("Queue Underflow");
        return;
    }

    queue.shift();

    $("#msg").text("Element Dequeued");

    showQueue();
});

```