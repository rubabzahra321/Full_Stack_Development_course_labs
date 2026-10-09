
// firstly access all needed html elements
const form = document.getElementById("studentForm");
const subjectRows = document.getElementById("subjectRows");
const addSubject = document.getElementById("addSubject");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");

let students = [];


// add elements for adding new subject
addSubject.addEventListener("click", function () {

    let row = document.createElement("div");
    row.className = "subject-row";

    let subject = document.createElement("input");
    subject.type = "text";
    subject.className = "subject-name";
    subject.placeholder = "Subject";
    subject.required = true;

    let marks = document.createElement("input");
    marks.type = "number";
    marks.className = "subject-marks";
    marks.placeholder = "Marks";
    marks.min = 0;
    marks.max = 100;
    marks.required = true;

    let button = document.createElement("button");
    button.type = "button";
    button.className = "remove-btn";
    button.textContent = "Remove";

    button.onclick = function () {
        row.remove();
    };

    row.appendChild(subject);
    row.appendChild(marks);
    row.appendChild(button);

    subjectRows.appendChild(row);
});


// submit the form
form.addEventListener("submit", function (event) {

    event.preventDefault();

    let name = document.getElementById("studentName").value;
    let image = document.getElementById("studentImage").value;

    let rows = document.querySelectorAll(".subject-row");
    let subjects = [];

    for (let row of rows) {

        let subjectName = row.querySelector(".subject-name").value;
        let marks = Number(row.querySelector(".subject-marks").value);

        subjects.push({
            name: subjectName,
            marks: marks
        });
    }

    students.push({
        name: name,
        image: image,
        subjects: subjects
    });

    showStudents();

    form.reset();
});


// Display students 
function showStudents() {

    tableHead.textContent = "";
    tableBody.textContent = "";

    let subjects = students[0].subjects;


    // create table element
    let headerRow = document.createElement("tr");

    let imageHeader = document.createElement("th");
    imageHeader.textContent = "Image";
    headerRow.appendChild(imageHeader);

    let nameHeader = document.createElement("th");
    nameHeader.textContent = "Name";
    headerRow.appendChild(nameHeader);

    for (let subject of subjects) {

        let header = document.createElement("th");
        header.textContent = subject.name;

        headerRow.appendChild(header);
    }

    let totalHeader = document.createElement("th");
    totalHeader.textContent = "Total";
    headerRow.appendChild(totalHeader);

    let percentageHeader = document.createElement("th");
    percentageHeader.textContent = "Percentage";
    headerRow.appendChild(percentageHeader);

    let gradeHeader = document.createElement("th");
    gradeHeader.textContent = "Grade";
    headerRow.appendChild(gradeHeader);

    tableHead.appendChild(headerRow);


    // Student rows
    for (let student of students) {

        let row = document.createElement("tr");


        // Image
        let imageCell = document.createElement("td");

        let img = document.createElement("img");
        img.src = student.image;

        imageCell.appendChild(img);
        row.appendChild(imageCell);


        // Name
        let nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        row.appendChild(nameCell);


        // Marks and total
        let total = 0;

        for (let subject of student.subjects) {

            let cell = document.createElement("td");

            cell.textContent = subject.marks;
            row.appendChild(cell);

            total = total + subject.marks;
        }


        // Percentage
        let percentage = total / student.subjects.length;


        // Grade
        let grade;

        if (percentage >= 90)
            grade = "A+";
        else if (percentage >= 80)
            grade = "A";
        else if (percentage >= 70)
            grade = "B";
        else if (percentage >= 60)
            grade = "C";
        else if (percentage >= 50)
            grade = "D";
        else
            grade = "F";


        // Total
        let totalCell = document.createElement("td");
        totalCell.textContent = total;
        row.appendChild(totalCell);


        // Percentage
        let percentageCell = document.createElement("td");
        percentageCell.textContent = percentage.toFixed(2) + "%";
        row.appendChild(percentageCell);


        // Grade
        let gradeCell = document.createElement("td");
        gradeCell.textContent = grade;
        row.appendChild(gradeCell);


        tableBody.appendChild(row);
    }
}

