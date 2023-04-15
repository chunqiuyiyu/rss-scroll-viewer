function openOnce(url, target) {
  const width = 400
  const height = 550

  // open a blank "target" window
  // or get the reference to the existing "target" window
  const winRef = window.open(
    "",
    target,
    `left=100,top=150,height=${height},width=${width},scrollbars`
  )

  // if the "target" window was just opened, change its url
  if (winRef.location.href === "about:blank") {
    winRef.location.href = url
  }
  return winRef
}

const htmlString = `
  <html lang="en">
    <head>
        <title>RSS scroll viewer</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <style>
          body {
            font-size: 1.2em;
            line-height: 1.5;
            color: #333;
            padding: 1em;
            margin: 0;
          }

          h1 a{
              color: inherit;
          }

        #content li::marker {
          color: gray;
            margin-right: 0.5em;
        }

        #content li a {
          text-decoration: none;
          color: inherit;
        }

        #content li a:hover {
          text-decoration: underline;
        }

        #content li span.origin {
          font-size: 0.8em;
          color: #999;
          margin-left: 0.5em;
        }

        ol+a{
            color: #0000ee;
            float: right;
        }
      </style>
  <body>
    <h1><a target="_blank" href="https://github.com/chunqiuyiyu/rss-scroll-viewer">RSS scroll viewer</a></h1>

    <div id="test"></div>
    <div id="wrapper" style="height: 400px; overflow: auto">
        <div style="color: gray;display: none">
            <span style="font-weight: bold;font-size: 2em" >＼(°ロ＼)</span>
            <br>
            <span style="font-size: 1em">There's nothing here…<br>Add RSS feed to view the content</span>
        </div>
      <ol id="content" style="display: none;gap: 1em"></ol>

    </div>
  </body>
</html>`

const w = openOnce("", "RSS scroll viewer")

w.document.write(htmlString)
w.document.close()

const rssObjs = [
  {
    url: "https://sspai.com/feed",
    isLoad: false,
  },
  {
    url: "https://news.ycombinator.com/rss",
    isLoad: false,
  },
  {
    url: "https://lobste.rs/rss",
    isLoad: false,
  },
  {
    url: "https://hnrss.org/newest",
    isLoad: false,
  },
  {
    url: "https://www.theguardian.com/international/rss",
    isLoad: false,
  },
]

// get rss feed from local storage
// rssObjs = JSON.parse(localStorage.getItem("rssObjs")) || []

const API_BASE = "https://api.rss2json.com/v1/api.json?rss_url="

const wrapperEl = w.document.querySelector("#wrapper")
const contentEl = w.document.querySelector("#content")
const tipEl = w.document.querySelector("#wrapper>div")

let throttleTimer = false
const throttle = (callback) => {
  if (throttleTimer) return

  throttleTimer = true

  setTimeout(() => {
    callback()
    throttleTimer = false
  }, 500)
}

const promiseAppend = (el, html) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      el.innerHTML += html
      resolve()
    }, 40)
  })
}

let isTheEnd = false
const loadMore = async () => {
  const unLoadRss = rssObjs.find((rss) => !rss.isLoad)

  if (rssObjs.length === 0) {
    tipEl.style.display = "block"
    return
  }

  if (!unLoadRss) {
    wrapperEl.innerHTML += !isTheEnd
      ? `The end <span style="font-weight: bold">ヾ(°ロ°)ノ</span>`
      : ""
    isTheEnd = true
    return
  }

  contentEl.style.display = "grid"
  const response = await fetch(API_BASE + unLoadRss.url)
  const parsed = await response.json()
  rssObjs.find((rss) => !rss.isLoad).isLoad = true

  const origin = new URL(parsed.feed.url).origin
  const listItems = parsed.items.map((item) => {
    return (
      `<li><a href="${item.link}" target="_blank">${item.title}</a>` +
      `<span class="origin">(<a href="${origin}" target="_blank">${
        item.pubDate.split(" ")[0] + " | " + parsed.feed.title
      }</a>)</span>` +
      `</li>`
    )
  })

  // Queue 50ms setTimeout append to contentEL
  for (let item of listItems) {
    await promiseAppend(contentEl, item)
  }
}
const scroller = () =>
  throttle(async () => {
    // add more contents if user scrolled down enough
    if (
      wrapperEl.scrollTop + wrapperEl.offsetHeight + 150 >
      contentEl.offsetHeight
    ) {
      await loadMore()
    }
  })

wrapperEl.addEventListener("scroll", scroller)
w.onload = loadMore
