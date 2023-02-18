const Renderer = class {
    constructor(processor) {
        this.p= processor
        processor.addObserver(this) // visitor의 보스로 Renderer 지정    
    }
    observe(type) {type == 'rerender' && this.rerender()}
    rerender() {this.oldList && this.render({task: this.oldList.task, list:this.oldList.task.list})}
    render({task, list}) {
        this.oldList = list
        this.processor.folder(task)
        this.processor.parent(task)
        this.subTask(list)
    }
    subTask(list) {
        list.forEach(({task, list})=> {
            this.processor.task(task)
            if(list.length) {
                this.processor.parent(task)
                this.subTask(list)
            }
        })
    }
}
const Processor = class {
    constructor() {
      this.prop= Object.create(null)
      this._tv = TaskView.base
    }
    observe(msg){this.notify(msg)}
    addObserver(v) {this.observer=v} // boss 이면서 subject 이기 때문에 notify가 있음.
    notify(msg){this.observer && this.observer.observe(msg)}
    folder(task) {throw 'override'}
    task(task) {throw 'override'}
    parent(task) {throw 'override'}
    taskView(...tv) { // decorate set
        tv.forEach(v => this._tv = v.set(this._tv))
    }
    taskRender(task) {
        this._tv.addObserver(this) // tv의 boss를 나를 지정
        this._tv.task(this.prop.ptask, task)
    }
}
const Dom = class extends Processor {
    constructor (parent) {
        super() 
        this._p = parent  // 최상위 tag Id 
        // this._tv = TaskView.base  // decorate
    }
    folder ({_title:title} ) {
        const parent =document.querySelector(this._p)
        parent.innerHTML = '' 
        parent.appendChild(el('h1', {innerHTML: title}))
        this.prop.parent = parent
    }
    task (task) {
        const li =el('li')
        li.appendChild(el('div', {innerHTML:
            //  this._tv.task(this.prop.ptask, task)
            this.taskRender(task)
            }))
        this.prop.parent.appendChild(li)
        this.prop.parent  = li
    }
    parent(task) {
        const ul  =  el('ul')
        this.prop.parent.appendChild(ul)
        this.prop.parent = ul
        this.prop.ptask  = task
    }    
}
const TaskView = class { // decorate
    addObserver(v) { this.observer= v}
    notify(msg) {this.observer && this.observer.observe(msg)}
    set(tv ) {this._tv =tv; return this}
    task(parent, task) {
        this.result = this._tv? this._tv.task(parent, task): task._title 
        return this._task(parent, task)        
    }
    _task(parent,  task) {throw 'override'}
    // default decorate Function
    TaskView.base = new ( class extends TaskView{ 
        _task(parent, task) {return this.result}
    })
}
const Priority = class extends TaskView {
    _task(parent, task ) {
        return this.result.replace(
            /\[urgent|high|normal\]/gi, `<span class="$1">$1</span>`
        )
    }
}
const Member = class extends TaskView {
    constructor(...members) {
        this._reg=new RegExp(`@(${members.join('|')})`, 'g')
    }
    _task(task, parent, prev){
        return this.result.replace(
            this._reg, '<a href="member/$1">$1</a>'
        )
    }
}
const Remove = class extends TaskView {
    constructor() {
        // this._render = render 
    }
    _task(parent, task) {
        const id = Remove.id++    
        Remove[id] =_=> {
            delete Remove[id]
            parent.remove(task)
            // this.render._render() // 권한을 넘어서  
            this.notify('rerender')
        }
        return this.result+`<a onclick="Remove[${id}]()">X</a>`
    }    
}
Remove.id =0 
//=========================================================
const dom = new Dom('#base')
dom.taskView(new Member('hika', 'summer'), new Priority())
const renderer= new Renderer(dom)
renderer.render(folder.list('title'))