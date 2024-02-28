export default {
  theme: 'bubble',
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', {background: [false, '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff']}],
        [{list: 'ordered'}, {list: 'bullet'}],
        ['link', 'image', 'video'],
        [{header: [1, 2, 3, false]}]
      ],
      handlers: {
        image: selectLocalImage
      }
    }
  }
}

function selectLocalImage() {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.click()
  input.onchange = () => {
    const file = input.files[0]     // a File object
    console.log(file)
    if (/^image\//.test(file.type)) {
      saveToServer(file, this.quill)
    } else {
      console.warn(`${file.name} is not an image file`)
    }
  }
}

function saveToServer(file, editor) {
  const fd = new FormData()
  const xhr = new XMLHttpRequest()
  fd.append('image', file)
  xhr.open('POST', '/linqa/image')
  xhr.onload = () => {
    if (xhr.status === 200) {
      console.log('response', JSON.parse(xhr.response))
      const url = '/filerepo/' + encodeURIComponent(JSON.parse(xhr.response).repoPath)
      insertToEditor(url, editor)
    } else {
      console.warn(`Upload of ${file.name} failed`)
    }
  }
  xhr.send(fd)
}

function insertToEditor(url, editor) {
  const range = editor.getSelection()
  editor.insertEmbed(range.index, 'image', url)
}
