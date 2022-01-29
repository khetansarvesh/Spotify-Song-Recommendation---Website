// client-side js, loaded by index.html

// any console.log in this file will appear the browser console
console.log("Hello from script.js!")

// get Handlebars and axios from the window object. We added these to the window from a CDN link in index.html
const handlebars = window.Handlebars
const axios = window.axios

// get elements from the DOM 
const output = document.getElementById("recommendation-output");
const button = document.getElementById("submitButton");

// making some important functions
const disableButton = () => 
{
  button.value = "Searching..."
  button.disabled = true
}

const enableButton = () => 
{
  button.value = "Get recommendations"
  button.disabled = false
}

const submitForm = async (event) => // this function gets called on form submission
{
  try 
  {
    // This line prevents the page from reshing on form submit. By default, a form submission event refreshes the page
    event.preventDefault()  
    disableButton()
    
    // get form values 
    const elements = event.target.elements
    const artist_1 = elements.artist_1.value
    const artist_2 = elements.artist_2.value
    const artist_3 = elements.artist_3.value

    // send a POST request to the backend /recommendations path to get song recommendations
    let result
    try 
    {
      result = await axios.post("/recommendations", { artist_1, artist_2, artist_3 })
    }
    catch (err) 
    {
      let errMsg = "Something went wrong"
      // overwrite generic error message with server error if present
      if(err.response.data.message) 
      {
        errMsg = err.response.data.message 
      } 
      return alert(errMsg)
    }
    const recommendations = result.data.tracks

    // get top 5 recommendations
    const topFiveRecs = recommendations.slice(0,5)
    
    // creating the new html page after getting recommendations
    const templateRaw = 
          `
            <p>If you like "{{artist_1}}, {{artist_2}}, {{artist_3}}", you'll love:</p>
            <ul>
              {{#each topFiveRecs}}
              <li>{{name}} - <a href="{{external_urls.spotify}}" target="_blank">Play</a></li>
              {{/each}}
            </ul>
          `
    const template = handlebars.compile(templateRaw)
    const recommendationsHtml = template({ artist_1, artist_2, artist_3, topFiveRecs })

    // set the recommendation output's inner html do the resolved temple
    output.innerHTML = recommendationsHtml
  } 
  
  catch(err) 
  {  
    // show a pop up error message if something goes wrong
    alert("Something went wrong. " + err.message)
  } 
  
  finally 
  {
    // regardless of outcome, re-enable button
    enableButton()
  }
}