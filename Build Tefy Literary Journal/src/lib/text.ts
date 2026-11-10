/** Strip markup with a linear scan so untrusted long text cannot trigger regex backtracking. */
export function stripHtmlTags(value: string): string {
  let insideTag = false
  let pendingTag: string[] = []
  const output: string[] = []
  for (const character of value) {
    if (insideTag) {
      pendingTag.push(character)
      if (character === '>') {
        insideTag = false
        pendingTag = []
        output.push(' ')
      }
    } else if (character === '<') {
      insideTag = true
      pendingTag = ['<']
    } else {
      output.push(character)
    }
  }
  if (insideTag) output.push(pendingTag.join(''))
  return output.join('')
}

/** Truncate at the previous word boundary without an unbounded regular expression. */
export function truncateAtWordBoundary(value: string, max: number): string {
  if (value.length <= max) return value
  let end = max
  while (end > 0 && !/\s/.test(value[end - 1])) end -= 1
  return (end > 0 ? value.slice(0, end) : value.slice(0, max)).trimEnd()
}

export function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end -= 1
  return value.slice(0, end)
}
