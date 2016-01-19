import {Block, Paragraph, Attribute, Pos} from "../../../../git/prosemirror/dist/model"
import {elt, insertCSS} from "../../../../git/prosemirror/dist/dom"
import {defParser, defParamsClick, andScroll, namePattern, nameTitle, selectedNodeAttr} from "../utils"

export class CheckItem extends Block {
	static get kinds() { return "checkitem" }
	get isTextblock() { return true }
	get attrs() {
		return {
			name: new Attribute,
			value: new Attribute,
			class: new Attribute({default: "widgets-checkitem"})
		}
	}
	create(attrs, content, marks) {
		// if content not null then it is a fragment with paragraph as first child
		let para = content? content = content.firstChild: pm.schema.defaultTextblockType().create(null)
		return super.create(attrs,[this.schema.node("checkbox",attrs),para],marks)
	}
}

export class CheckList extends Block {
	static get contains() { return "checkitem" }
	get attrs() {
		return {
			name: new Attribute,
			title: new Attribute,
			layout: new Attribute({default: "vertical"}),
			class: new Attribute({default: "widgets-checklist widgets-edit"})
		}
	}
	get isList() { return true }
}

defParser(CheckItem,"div","widgets-checkitem")
defParser(CheckList,"div","widgets-checklist")

CheckItem.prototype.serializeDOM = (node,s) => s.renderAs(node,"div", node.attrs)

CheckList.prototype.serializeDOM = (node,s) => s.renderAs(node,"div",node.attrs)

CheckItem.register("command", {
	  name: "splitCheckitem",
	  label: "Split the current checkitem",
	  run(pm) {
	    let {from, to, node} = pm.selection
	    if ((node && node.isBlock) || from.path.length < 2 || !Pos.samePath(from.path, to.path)) return false
	    let toParent = from.shorten(), parent = pm.doc.path(toParent.path)
	    if (parent.type != this) return false
	    let nextType = to.offset == parent.child(toParent.offset).size ? pm.schema.defaultTextblockType() : null
	    // need to renumber nodes and move cursor
	    return pm.tr.delete(from, to).split(from, 2, nextType).apply(andScroll)
	  },
	  keys: ["Enter(19)"]
	})


CheckItem.register("command", {
  name: "deleteCheckItem",
  label: "delete this checkitem or checklist",
  run(pm) {
	let {from,to} = pm.selection
    return pm.tr.delete(from.move(-1),to).apply(andScroll)
  },
  keys: ["Backspace(50)", "Mod-Backspace(50)"]
})

CheckList.register("command", {
	name: "insertCheckList",
	label: "CheckList",
	run(pm, name, title, layout) {
		let cl = this.create({name, title, layout}, pm.schema.node("checkitem",{name, value: 0}))
		let tr = pm.tr.replaceSelection(cl).apply(andScroll)
		return tr
  	},
	select(pm) {
		return pm.doc.path(pm.selection.from.path).type.canContainType(this)
	},
	params: [
 	    { name: "Name", label: "Short ID", type: "text",
   	  	  prefill: function(pm) { return selectedNodeAttr(pm, this, "name") },
 		  options: {
 			  pattern: namePattern, 
 			  size: 10, 
 			  title: nameTitle}},
	    { name: "Title", label: "Title", type: "text",
	      prefill: function(pm) { return selectedNodeAttr(pm, this, "title") }},
	    { name: "Layout", label: "vertical or horizontal", type: "select",
	      prefill: function(pm) { return selectedNodeAttr(pm, this, "layout") },
	      options: [
     	      {value: "horizontal", label: "horizontal"},
     	      {value: "vertical", label: "vertical"}
     	  ]}
	]
})

defParamsClick(CheckList,"schema:checklist:insertCheckList")

insertCSS(`

.ProseMirror .widgets-checkitem {
	float: left;
}

div.widgets-checkitem:first-child input {
	display: none;
}

.ProseMirror .widgets-checkitem:hover {
	cursor: text;
}

.widgets-checklist:before {
	content: attr(title);
	color: black;
	font-size: 14px;
	font-weight: bold;
}

.ProseMirror .widgets-checklist {}

`)