
let stack = [];

const buttons = document.querySelectorAll(".btn");
const stackBox = document.getElementById("stack");
const msg = document.getElementById("msg");

buttons.forEach(button => {

    button.addEventListener("click", function(){

        stack.push(this.innerText);

        showStack();
    });

});

function showStack(){

    stackBox.innerHTML = "";

    for(let i = stack.length - 1; i >= 0; i--){

        stackBox.innerHTML +=
        `<div class="item">${stack[i]}</div>`;
    }
}

document.addEventListener("click", function(e){

    if(e.target.classList.contains("item")){

        if(stack.length == 0){

            msg.innerText = "Stack Underflow";
            return;
        }

        stack.pop();

        msg.innerText = "Element Popped";

        showStack();
    }
});

```
let stack = [];

$(".btn").click(function(){

    stack.push($(this).text());

    showStack();
});

function showStack(){

    $("#stack").html("");

    for(let i = stack.length - 1; i >= 0; i--){

        $("#stack").append(
            "<div class='item'>" + stack[i] + "</div>"
        );
    }
}

$(document).on("click",".item",function(){

    if(stack.length == 0){

        $("#msg").text("Stack Underflow");
        return;
    }

    stack.pop();

    $("#msg").text("Element Popped");

    showStack();
});
```