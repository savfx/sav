import * as SavUtil from 'sav-util'
import {getNativeType} from './type'

const {tmpl} = SavUtil

function prepareListState (input, opts = {}) {
  let state = {
    SavUtil
  }
  state.input = input
  state.listName = input.name
  state.refType = getNativeType(input.list)
  state.ctx = opts.ctx
  return state
}

export function createListBody (input, opts = {}) {
  return makeListBody(prepareListState(input, opts))
}

const makeListBody = tmpl(`{% 
  const {ucfirst, lcfirst} = state.SavUtil
%}
// {%#state.listName%} {%#state.input.title%} 
type {%#state.listName%} []{%#state.refType%}

func Parse{%#state.listName%}(arr * convert.ArrayAccess) * {%#state.listName%} {
\tif arr == nil {
\t\treturn nil
\t}
\tres := make({%#state.listName%}, 0)
\tarr.ForEach(func (index int, val * convert.ValueAccess) bool {
{% if (state.ctx.isStruct(state.refType)){ %}\t\tres = append(res, *Parse{%#state.refType%}(val.Object()))
{% }else if (state.ctx.isList(state.refType)){ %}\t\tres = append(res, *Parse{%#state.refType%}(val.Array()))
{% }else if (state.ctx.isEnum(state.refType)){ %}\t\tres = append(res, *Parse{%#state.refType%}(val))
{% }else { %}\t\tres = append(res, val.{%#ucfirst(state.refType)%}())
{% } %}\t\treturn true
\t})
\treturn &res
}

func ParseForm{%#state.listName%}(arr * convert.FormArray) * {%#state.listName%} {
\tif arr == nil {
\t\treturn nil
\t}
\tres := make({%#state.listName%}, 0)
{% if (state.ctx.isStruct(state.refType)){ %}\tarr.EachField(func (index int, val * convert.FormObject) {
\t\tres = append(res, *ParseForm{%#state.refType%}(val))
\t})
{% } else if (state.ctx.isEnum(state.refType)){ %}\tarr.EachValue(func (index int, val * convert.ValueAccess) {
\t\tres = append(res, *ParseForm{%#state.refType%}(val))
\t})
{% } else if (state.ctx.isList(state.refType)){ %}\tarr.EachField(func (index int, val * convert.FormObject) {
\t\tres = append(res, *ParseForm{%#state.refType%}(val.GetArray(convert.StringVal(index))))
\t})
{% } else { %}\tarr.EachValue(func (index int, val * convert.ValueAccess) {
\t\tres = append(res, val.{%#ucfirst(state.refType)%}())
\t})
{% } %}\treturn &res
}

func (ctx * {%#state.listName%}) Append (val {%#state.refType%}) * {%#state.listName%}{
  *ctx = append(*ctx, val)
  return ctx
}

func (ctx * {%#state.listName%}) AppendAll (val []{%#state.refType%}) * {%#state.listName%}{
  for i, length := 0, len(val); i < length; i++ {
    *ctx = append(*ctx, val[i])
  }
  return ctx
}

func (ctx {%#state.listName%}) Check(t * checker.Checker) error {
{% if (state.ctx.isNative(state.refType)){ %} \treturn nil
{% } else { %}\treturn t.Exec(func () {
\t\tfor id, it := range ctx {
\t\t\tt.Index(id).Check(it).Pop()
\t\t}
\t})
{% } %}}`)
