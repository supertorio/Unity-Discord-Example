import './style.css'
import { DiscordSDK } from "@discord/embedded-app-sdk";

// This gets our activity ID from the .env file we created earlier.
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
console.log(discordSdk);

var canvas = document.querySelector("#unity-canvas");

function unityShowBanner(msg, type) {
  var warningBanner = document.querySelector("#unity-warning");
  function updateBannerVisibility() {
    warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
  }
  var div = document.createElement('div');
  div.innerHTML = msg;
  warningBanner.appendChild(div);
  if (type == 'error') div.style = 'background: red; padding: 10px;';
  else {
    if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
    setTimeout(function() {
      warningBanner.removeChild(div);
      updateBannerVisibility();
    }, 5000);
  }
  updateBannerVisibility();
}


async function setupDiscordSdk(){

  await discordSdk.ready();

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
      "guilds.members.read"
    ],
  });

   // Retrieve an access_token from your application's server
  const response = await fetch('/.proxy/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
    }),
  });
  const {access_token} = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });
}


// This url won't work
// var buildUrl = "Build";
// We need to tell it to use the proxy path
var buildUrl = "/.proxy/Build";
var loaderUrl = buildUrl + "/build.loader.js";
var config = {
  arguments: [],
  dataUrl: buildUrl + "/build.data.gz",
  frameworkUrl: buildUrl + "/build.framework.js.gz",
  codeUrl: buildUrl + "/build.wasm.gz",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "DefaultCompany",
  productName: "Sample_Platformer",
  productVersion: "5.0.2",
  showBanner: unityShowBanner,
};

document.querySelector("#unity-loading-bar").style.display = "block";

var script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
  createUnityInstance(canvas, config, (progress) => {
    document.querySelector("#unity-progress-bar-full").style.width = 100 * progress + "%";
        }).then(async (unityInstance) => { // Add the async modifier here
          document.querySelector("#unity-loading-bar").style.display = "none";

          // Setup Discord SDK Connection
          await setupDiscordSdk();
        }).catch((message) => {
          alert(message);
        });
      };

document.body.appendChild(script);