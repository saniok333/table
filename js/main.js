/**
 * для наполнения основного массива 
 */
class MatrixElement {
    constructor(i, j, min, max) {
        this.id = this.generateId(i, j);
        this.amount = this.generateAmount(min, max);
    }
    generateId(i, j) {
        return `${i}.${j}`;
    }
    generateAmount(min, max) {
        let rand = min + Math.random() * (max + 1 - min);
        return Math.floor(rand);
    }
}
/**
 * для наполнения временного массива который используется для подсчета "процентных значений" 
 */
class PecentageElement {
    constructor(tdPercentage, remainder, i) {
        this.tdPercentage = tdPercentage;
        this.remainder = remainder;
        this.id = i;
    }
}
/**
 * наполняет массив объектами класса MatrixElement
 */
let createArray = () => {
    matrix = [];
    for (let i = 0; i < M; i++) {
        matrix[i] = [];
        for (let j = 0; j < N; j++) {
            matrix[i][j] = new MatrixElement(i, j, 0, 999)
        }
    }
    return matrix;
}

/**
 * создает таблицу и добавляет ее в DOM
 */

let createTable = () => {
    if (matrix[0]) {
        let table = document.createDocumentFragment();
        for (let i = 0; i < matrix.length; i++) {
            let tr = document.createElement('tr');
            let sum = 0;
            for (let j = 0; j < matrix[i].length; j++) {
                let td = document.createElement('td');
                td.innerHTML = matrix[i][j].amount;
                tr.appendChild(td);
                //накапливаю сумму для ячейки суммы
                sum += matrix[i][j].amount;
            }
            //добавляю ячейку суммы
            let td = document.createElement('td');
            td.className = "sum";
            td.innerHTML = sum;
            tr.appendChild(td);
            //добавляю ячейку с кнопкой удаления строки
            let tdRemoveBtn = document.createElement('td');
            tdRemoveBtn.className = "remove-btn";
            let btn = document.createElement('button');
            btn.innerHTML = 'x';
            tdRemoveBtn.appendChild(btn);
            tr.appendChild(tdRemoveBtn);
            table.appendChild(tr);
        }
        //добавляю строку для ячеек со средними значениями столбиков
        let tr = document.createElement('tr');
        for (let j = 0; j < matrix[0].length; j++) {
            let sum = 0;
            let i = 0;
            for (; i < matrix.length; i++) {
                sum += matrix[i][j].amount;
            }
            let td = document.createElement('td');
            td.className = "average";
            td.innerHTML = Math.floor(sum / i);
            tr.appendChild(td);
        }
        table.appendChild(tr);

        document.getElementById('my_table').innerHTML = '';
        document.getElementById('my_table').appendChild(table);
    } else {
        //если массив пуст таблица не выводится
        document.getElementById('my_table').innerHTML = '';
    }
}

/**
 * в зависимости от координат ячейки и типа события вызывает нужную функцию
 */
let tdAction = (event, action) => {
    let td = event.target.closest('td');
    let tr = event.target.closest('tr');
    //если event.target не содержится внутри элемента td
    if (!td) {
        return;
    };
    //если координаты ячейки "в пределах элементов массива"
    if ((matrix.length > tr.rowIndex) && (matrix[0].length > td.cellIndex)) {
        if (action == 'click') {
            increaseMatrixElementAmount(tr.rowIndex, td.cellIndex);
            return;
        };
        if (action == 'mouseover') {
            highlightClosestTableCells(tr.rowIndex, td.cellIndex, 'mouseover');
            return;
        };
        if (action == 'mouseout') {
            highlightClosestTableCells(tr.rowIndex, td.cellIndex);
            return;
        };
    };
    //если координаты ячейки "в пределах сумм строк"
    if ((matrix.length > tr.rowIndex) && (matrix[0].length == td.cellIndex)) {
        if (action == 'mouseover') {
            displayRowPercent(tr.rowIndex, td.innerHTML);
            return;
        };
        if (action == 'mouseout') {
            displayRowInMatrixAmounts(tr.rowIndex);
            return;
        };
    };
    //если координаты ячейки "в пределах кнопок удаления строк"
    if ((matrix.length > tr.rowIndex) && (matrix[0].length + 1 == td.cellIndex)) {
        if (action == 'click') {
            let trRInd = tr.rowIndex;
            removeRow(trRInd);
            return;
        };
    };
}

/**
 * удаляет строку
 */
let removeRow = (row) => {
    matrix.splice(row, 1);
    /**
     * если после удаляемой строки оставались строки, то переназначает ID, 
     * иначе определение ближайших по значению ячеек будет работать некорректно
     */
    if ((matrix[0]) && (matrix.length > row)) {
        for (let i = row; i < matrix.length; i++) {
            for (let j = 0; j < N; j++) {
                matrix[i][j].id = `${i}.${j}`;
            }
        }
    }
    createTable();
}

/**
 * отображает строку в процентах при mouseover
 */
let displayRowPercent = (row, sum) => {
    let tr = document.getElementById('my_table').rows[row];
    //переменная для подсчета суммы округленных "процентных значений"
    let sumPercentage = 0;
    tempPercentageArray = [];
    for (let i = 0; i < N; i++) {
        let prePercentage = (matrix[row][i].amount * 100) / sum;
        let tdPercentage = Math.floor(prePercentage);
        let remainder = prePercentage - tdPercentage;
        sumPercentage += tdPercentage;
        /**
         * наполняем временный массив объектами класса PecentageElement в которые передаю:
         * округленное "процентное значение", остаток от сокращения "процентного значения"
         * и идентификатор 
         */
        tempPercentageArray[i] = new PecentageElement(tdPercentage, remainder, i);
    }
    let sumPercDif = 100 - sumPercentage;
    //проверяем или сумма округленных "процентных значений" отличается от 100
    if (sumPercDif) {
        //сортируем массив по зачению "остаток от сокращения" 
        tempPercentageArray.sort((a, b) => b.remainder - a.remainder);
        /**
         * увеличиваем на 1 свойство "процентное значение" объектов отсортированного массива
         * для уменьшения погрешности при посчетах "процентных значений"
         * 
         * единицы добавятся в первую очередь в объекты с наибольшим "остатком от сокращения"
         *   
         * количество обьектов в которых произойдет увеличение соответствует цифре которой 
         * не хватает до 100 при подсчете суммы округленных "процентных значений"
         */
        for (let i = 0; i < sumPercDif; i++) {
            tempPercentageArray[i].tdPercentage++
        };
        //возвращаем массиву прежнюю последовательность
        tempPercentageArray.sort((a, b) => a.id - b.id);
    };
    //отображаем в таблице "процентные значения" в том числе и в виде столбиков
    for (let i = 0; i < N; i++) {
        tr.cells[i].innerHTML = '';
        let p = document.createElement('p');
        p.innerHTML = `${tempPercentageArray[i].tdPercentage}%`;
        tr.cells[i].appendChild(p);
        let div = document.createElement('div');
        div.classList.add('percentage-bgr');
        div.style.height = `${tempPercentageArray[i].tdPercentage}%`;
        tr.cells[i].appendChild(div);
    }
}

/**
 * при mouseout возвращает прежнее отображение строки
 */
let displayRowInMatrixAmounts = (row) => {
    let tr = document.getElementById('my_table').rows[row];
    for (let i = 0; i < N; i++) {
        tr.cells[i].innerHTML = matrix[row][i].amount;
    }
}

/**
 * увеличивает зщначение элемента массива
 */
let increaseMatrixElementAmount = (row, column) => {
    matrix[row][column].amount++;
    createTable();
}

/**
 * сортирует элементы массива для нахождения ближайших по значению 
 */
let sortTempArr = (row, column) => {
    tempArr = [];
    //загоняем наш двумерный массив во временный одномерный
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (!(i == row && j == column)) {
                tempArr.push(matrix[i][j]);
            }
        }
    }
    //значение к которому нужно искать ближайшие
    let currAmount = matrix[row][column].amount;
    //собственно сортировка
    tempArr.sort((a, b) => Math.abs(a.amount - currAmount) - Math.abs(b.amount - currAmount));
}

/**
 * подсвечивает (при mouseover)
 * либо убирает подсветку (при mouseout) с Х близких по значению ячеек  
 */
let highlightClosestTableCells = (row, column, action) => {
    if (action == 'mouseover') {
        sortTempArr(row, column);
    };
    for (let i = 0;
        ((i < X) && (i < tempArr.length)); i++) {
        let highlightRow = (tempArr[i].id).split('.')[0];
        let highlightColumn = (tempArr[i].id).split('.')[1];
        let td = document.getElementById('my_table').rows[highlightRow].cells[highlightColumn];
        if (action == 'mouseover') {
            td.classList.add('highlight');
        } else {
            td.classList.remove('highlight');
        };
    }
}

/**
 * добавляет строку  
 */
let addRow = () => {
    let row;
    //если массив пуст то при обращении к matrix.length будет ошибка - следовательно добавляем условие
    if (matrix[0]) {
        row = matrix.length;
    } else {
        row = 0;
    };
    matrix[row] = [];
    for (let i = 0; i < N; i++) {
        matrix[row][i] = new MatrixElement(row, i, 0, 999);
    }
    createTable();
}

let tempArr;
let matrix;
const M = 3;
const N = 4;
const X = 3;

createArray();
createTable();
//кнопка для добавления строки
let addBtn = document.createElement('button');
addBtn.id = "add_btn";
addBtn.innerHTML = 'Add Row';
document.body.appendChild(addBtn);

//обработка клика по кнопке для добавления строки
document.getElementById('add_btn').addEventListener('click', () => {
    addRow();
});

//далее обработки событий на ячейках таблицы
document.getElementById('my_table').addEventListener('click', (event) => {
    tdAction(event, 'click');
});

document.getElementById('my_table').addEventListener('mouseover', (event) => {
    tdAction(event, 'mouseover');
});

document.getElementById('my_table').addEventListener('mouseout', (event) => {
    tdAction(event, 'mouseout');
});