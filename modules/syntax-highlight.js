function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateSyntaxHighlight() {
  const editor = document.getElementById("codeEditor");
  const highlight = document.getElementById("syntaxHighlight");
  if (!editor || !highlight) return;
  const code = editor.value;
  const lines = code.split("\n");
  const lang = document.getElementById("languageSelect")?.value || "javascript";
  const highlighters = {
    javascript: highlightJS,
    python: highlightPython,
    java: highlightJava,
    cpp: highlightCpp,
    c: highlightC,
    swift: highlightSwift,
  };
  const fn = highlighters[lang] || escapeHtml;
  const highlighted = lines.map(line => fn(line)).join("\n");
  highlight.innerHTML = highlighted + "\n";
}

function highlightJS(line) {
  const kwType = {
    function:'decl',const:'decl',let:'decl',var:'decl',class:'decl',extends:'decl',
    import:'decl',export:'decl',from:'decl',as:'decl',async:'decl',await:'decl',
    yield:'decl',new:'decl',this:'decl',super:'decl',
    return:'flow',if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',
    break:'flow',continue:'flow',switch:'flow',case:'flow',default:'flow',
    try:'flow',catch:'flow',finally:'flow',throw:'flow',typeof:'flow',
    instanceof:'flow',void:'flow',delete:'flow',in:'flow',of:'flow',
    with:'flow',debugger:'flow',
    true:'literal',false:'literal',null:'literal',undefined:'literal',
  };
  const regex = /(<[^>]+>)|(\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b(?:function|const|let|var|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|class|extends|super|import|export|from|as|async|await|yield|typeof|instanceof|void|delete|in|of|with|debugger|true|false|null|undefined)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, tag, comment, str, kw, num) => {
    if (tag) return tag;
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightPython(line) {
  const kwType = {
    class:'decl',def:'decl',lambda:'decl',async:'decl',await:'decl',
    global:'decl',nonlocal:'decl',with:'decl',as:'decl',from:'decl',import:'decl',
    break:'flow',continue:'flow',for:'flow',while:'flow',if:'flow',elif:'flow',
    else:'flow',return:'flow',yield:'flow',raise:'flow',try:'flow',except:'flow',
    finally:'flow',assert:'flow',pass:'flow',del:'flow',in:'flow',is:'flow',
    not:'flow',and:'flow',or:'flow',
    True:'literal',False:'literal',None:'literal',
  };
  const regex = /(#[^]*$)|("[^"]*"|'[^']*')|(\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightJava(line) {
  const kwType = {
    class:'decl',interface:'decl',enum:'decl',extends:'decl',implements:'decl',
    abstract:'decl',final:'decl',static:'decl',native:'decl',transient:'decl',
    volatile:'decl',synchronized:'decl',strictfp:'decl',package:'decl',
    import:'decl',new:'decl',this:'decl',super:'decl',
    boolean:'type',byte:'type',char:'type',short:'type',int:'type',
    long:'type',float:'type',double:'type',void:'type',
    if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',break:'flow',
    continue:'flow',switch:'flow',case:'flow',default:'flow',return:'flow',
    throw:'flow',throws:'flow',try:'flow',catch:'flow',finally:'flow',
    assert:'flow',instanceof:'flow',goto:'flow',const:'flow',
    public:'flow',private:'flow',protected:'flow',
    true:'literal',false:'literal',null:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null)\b)|(@\w+)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[fFLl]?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, kw, ann, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (ann) return '<span class="token keyword keyword-decl">' + ann + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightCpp(line) {
  const kwType = {
    class:'decl',struct:'decl',enum:'decl',union:'decl',namespace:'decl',
    using:'decl',template:'decl',typename:'decl',typedef:'decl',new:'decl',
    this:'decl',friend:'decl',virtual:'decl',override:'decl',explicit:'decl',
    mutable:'decl',inline:'decl',constexpr:'decl',decltype:'decl',static:'decl',
    extern:'decl',const:'decl',volatile:'decl',register:'decl',auto:'decl',
    operator:'decl',export:'decl',
    bool:'type',char:'type',int:'type',float:'type',double:'type',
    long:'type',short:'type',signed:'type',unsigned:'type',void:'type',
    if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',break:'flow',
    continue:'flow',switch:'flow',case:'flow',default:'flow',return:'flow',
    throw:'flow',try:'flow',catch:'flow',noexcept:'flow',sizeof:'flow',
    typeid:'flow',static_cast:'flow',dynamic_cast:'flow',reinterpret_cast:'flow',
    const_cast:'flow',static_assert:'flow',goto:'flow',
    public:'flow',private:'flow',protected:'flow',
    true:'literal',false:'literal',nullptr:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(#.*$)|(\b(?:alignas|alignof|auto|bool|break|case|catch|char|class|const|constexpr|continue|decltype|default|delete|do|double|else|enum|explicit|export|extern|false|float|for|friend|goto|if|include|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|while)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[uUlLfF]?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, pre, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (pre) return '<span class="token preprocessor">' + pre + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightC(line) {
  const kwType = {
    struct:'decl',union:'decl',enum:'decl',typedef:'decl',static:'decl',
    extern:'decl',const:'decl',volatile:'decl',register:'decl',auto:'decl',
    char:'type',int:'type',float:'type',double:'type',long:'type',
    short:'type',signed:'type',unsigned:'type',void:'type',
    if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',break:'flow',
    continue:'flow',switch:'flow',case:'flow',default:'flow',return:'flow',
    sizeof:'flow',goto:'flow',
    NULL:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(#.*$)|(\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|include|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|NULL)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[uUlL]?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, pre, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (pre) return '<span class="token preprocessor">' + pre + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightSwift(line) {
  const kwType = {
    class:'decl',struct:'decl',enum:'decl',protocol:'decl',extension:'decl',
    func:'decl',init:'decl',deinit:'decl',subscript:'decl',typealias:'decl',
    associatedtype:'decl',let:'decl',var:'decl',import:'decl',operator:'decl',
    open:'decl',public:'decl',internal:'decl',fileprivate:'decl',private:'decl',
    static:'decl',inout:'decl',
    if:'flow',else:'flow',for:'flow',while:'flow',repeat:'flow',switch:'flow',
    case:'flow',default:'flow',break:'flow',continue:'flow',return:'flow',
    throw:'flow',throws:'flow',rethrows:'flow',try:'flow',catch:'flow',
    defer:'flow',guard:'flow',where:'flow',in:'flow',as:'flow',is:'flow',
    fallthrough:'flow',do:'flow',
    true:'literal',false:'literal',nil:'literal',self:'literal',Self:'literal',super:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|"""(?:(?!""").)*""")|(\b(?:associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|static|struct|subscript|typealias|var|break|case|continue|default|defer|do|else|fallthrough|for|guard|if|in|repeat|return|switch|where|while|as|catch|false|is|nil|rethrows|super|self|Self|throw|throws|true|try)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function updateCurrentLineHighlight() {
  const editor = document.getElementById('codeEditor');
  const indicator = document.getElementById('currentLineIndicator');
  if (!editor || !indicator) return;
  const textBefore = editor.value.substring(0, editor.selectionStart);
  const lineNumber = textBefore.split('\n').length;
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 22.4;
  const paddingTop = parseFloat(getComputedStyle(editor).paddingTop) || 16;
  const scrollTop = editor.scrollTop;
  indicator.style.top = (paddingTop + (lineNumber - 1) * lineHeight - scrollTop) + 'px';
  indicator.style.height = lineHeight + 'px';
}

export function initSyntaxHighlight() {
  const editor = document.getElementById('codeEditor');
  if (editor) {
    editor.addEventListener('input', updateSyntaxHighlight);
    editor.addEventListener('scroll', updateCurrentLineHighlight);
    editor.addEventListener('keyup', updateCurrentLineHighlight);
    editor.addEventListener('click', updateCurrentLineHighlight);
  }
}
