import _ from 'lodash/fp.js'
import F from 'futil/src/index.js'
import { _getAdministration } from 'mobx'

// Array

let trimEnd = _.trimEnd.convert({ fixed: false })
let trimStart = _.trimStart.convert({ fixed: false })

export let joinPaths = _.curry((p1, p2) =>
  F.compactJoin('.', [trimEnd(p1, '.'), trimStart(p2, '.')])
)

let parentRegex = /\.\w+$/

export let parentPath = (p) => trimEnd(p, '.').replace(parentRegex, '')

export let siblingPath = (p1, p2) => joinPaths(parentPath(p1), p2)

// Object

export let unmerge = _.flow(F.diff, _.mapValues('to'))

export let mergeWithFns = _.mergeWith((x, fn) =>
  F.when(_.isUndefined, null, fn(x))
)

// Tree

export let treePath = (value, key, parents, parentsKeys) =>
  _.flow(_.dropRight(1), _.reverse, _.map(_.toString))([key, ...parentsKeys])

let traverse = F.unless(F.isTraversable, undefined)

export let dotTreePath = _.flow(treePath, F.dotEncoder.encode)

export let flattenTree = (next = traverse) => (buildPath = dotTreePath) =>
  F.reduceTree(next)(
    (result, node, ...x) => _.set([buildPath(node, ...x)], node, result),
    {}
  )

export let flattenTreeLeaves = (next = traverse) => (buildPath = dotTreePath) =>
  F.reduceTree(next)(
    (result, node, ...x) =>
      next(node, ...x) ? result : _.set([buildPath(node, ...x)], node, result),
    {}
  )

// Aspect

let onCommandStatus = (predicate) => (fn) =>
  F.aspect({
    async after(result, state, args) {
      if (predicate(state)) {
        await fn(result, state, args)
      }
    },
  })

export let onCommandSuccess = onCommandStatus(_.get('succeeded'))

let dotRegex = /\./g

export let fieldId = ({ path, form }) =>
  `${_getAdministration(form).name.replace('@', '')}.${path}`.replace(
    dotRegex,
    '-'
  )
