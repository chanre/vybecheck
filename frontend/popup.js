// Chrome Extension Popup JS
//

chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
  var tabTitle =  tabs[0].title;
  var tabUrl = tabs[0].url;
  var userVoted;
  var numVotes;

  votes = getVotes(tabTitle).then(function(item) {
    if (item == "None") { 
      numVotes.upvotes = 0;
      numVotes.downvotes = 0;
    } else {
      numVotes = item;
    }

    checkURL(tabUrl).then(function(item) {
      userVoted = item;
      if (tabTitle.length > 56) {
        document.getElementById('title').textContent = (tabTitle.substring(0, 56) + "...");
      } else {
        document.getElementById('title').textContent = tabTitle;
      }
      
      if (userVoted == "upvoted") {
        document.getElementById("uparrow").src = "/images/uparrowhover.png";
      } else if (userVoted == "downvoted") {
        document.getElementById("downarrow").src = "/images/downarrowhover.png";
      }
      
      votePress(tabTitle, tabUrl, userVoted, numVotes);
  
    });

  });

});

async function getVotes(tab) {
  let response = await fetch('http://127.0.0.1:5000?' + new URLSearchParams({title: tab}))
  if (response.ok) {
    let votes = await response.json();
    document.getElementById('numUpvotes').textContent = await votes.upvotes;
    document.getElementById('numDownvotes').textContent = await votes.downvotes;
    return votes;
  } else {
    return "None";
  }
  
}

async function sendVotes(data) { 
  let response = await fetch('http://127.0.0.1:5000/', {
    method: "post",
    mode: "cors",
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(data)
  });
}

async function storeURL(tab, vote) {
  var url = tab;
  var obj = {};
  obj[url] = vote;
  chrome.storage.local.set(obj, function() {
  });
}

async function checkURL(url){
  var vote = "";
  return votePromise = new Promise(function (resolve) { 
    chrome.storage.local.get([url], function(item) {
      if (item[url] == "upvoted" || item[url] == "downvoted") {
        vote = item[url];
      }
      resolve(vote);
    });
  });
}

function votePress(title, tabUrl, voted, numVotes) {
  var arrow = document.getElementsByClassName('arrow');
  
  var voting = function(event) {
    var id = event.currentTarget.id;
    let data = {
      tab: title,
      vote: id,
      url: tabUrl,
    }
    
    if (voted == "upvoted" && id == "upvote") {
      document.getElementById("uparrow").src = "/images/uparrow.png";
      data.vote = "unupvote";
      numVotes.upvotes--;
      storeURL(tabUrl, "");
    } else if (voted == "upvoted" && id == "downvote") {
      document.getElementById("uparrow").src = "/images/uparrow.png";
      document.getElementById("downarrow").src = "/images/downarrowhover.png";
      numVotes.upvotes--;
      numVotes.downvotes++;
      data.vote = "uptodown";
      storeURL(tabUrl, "downvoted");
    } else if (voted == "downvoted" && id == "downvote") {
      document.getElementById("downarrow").src = "/images/downarrow.png";
      numVotes.downvotes--;
      data.vote = "undownvote";
      storeURL(tabUrl, "");
    } else if (voted == "downvoted" && id == "upvote") { 
      document.getElementById("uparrow").src = "/images/uparrowhover.png";
      document.getElementById("downarrow").src = "/images/downarrow.png";
      numVotes.upvotes++;
      numVotes.downvotes--;
      data.vote = "downtoup";
      storeURL(tabUrl, "upvoted");
    } else if (id == "upvote") {
      document.getElementById("uparrow").src = "/images/uparrowhover.png";
      numVotes.upvotes++;
      storeURL(tabUrl, "upvoted");
    } else if (id == "downvote") {
      document.getElementById("downarrow").src = "/images/downarrowhover.png";
      numVotes.downvotes++;
      storeURL(tabUrl, "downvoted");
    }

    document.getElementById("numUpvotes").textContent = numVotes.upvotes;
    document.getElementById("numDownvotes").textContent = numVotes.downvotes;

    sendVotes(data);

    checkURL(data.url).then(function(item) {
      voted = item;
    })

  }

  for (var i = 0; i < arrow.length; i++) {
    arrow[i].addEventListener('click', voting, false);
  }

}