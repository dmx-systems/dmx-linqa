import 'quill-mention'
import 'quill-mention/dist/quill.mention.css'
import COLOR_PALETTE from './lq-color-palette'

const atValues = [
  {id: 1, value: "Fredrik Sundqvist"},
  {id: 2, value: "Patrik Sjölin"}
];
const hashValues = [
  {id: 3, value: "Fredrik Sundqvist 2"},
  {id: 4, value: "Patrik Sjölin 2"}
];

export default {
  theme: 'bubble',
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', {background: COLOR_PALETTE.textBackground}],
        [{list: 'ordered'}, {list: 'bullet'}],
        ['link', 'image', 'video'],
        [{header: [1, 2, 3, false]}]
      ],
      handlers: {
        image: selectLocalImage
      }
    },
    mention: {
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      mentionDenotationChars: ["@", "#"],
      source: function(searchTerm, renderList, mentionChar) {
        let values;
        if (mentionChar === "@") {
          values = atValues;
        } else {
          values = hashValues;
        }
        if (searchTerm.length === 0) {
          renderList(values, searchTerm);
        } else {
          const matches = [];
          for (let i = 0; i < values.length; i++) {
            if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) {
              matches.push(values[i]);
            }
          }
          renderList(matches, searchTerm);
        }
      }
    }
  }
}

// Image upload

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
