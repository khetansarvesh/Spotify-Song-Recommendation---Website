// server.js -> where your node app starts

// importing some required frameworks
const express = require("express");
const app = express();  // creating an instance called 'app' of framework express
const axios = require("axios");
const qs = require("qs");

// defining some variable names
const SPOTIFY_ACCESS_TOKEN_URL = "https://accounts.spotify.com/api/token"
const BASE_URL = "https://api.spotify.com/v1"

// set up the app to parse JSON request bodies
app.use(express.json());

// make all the files in 'public' available -> https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// return the index.html file when a GET request is made to the root path "/"
app.get
("/", (req, res) => 
  {
    res.sendFile(__dirname + "/public/index.html");
  }
);

// This function uses Client Credentials to obtain an access token from Spotify => See Spotify auth documentation: https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
const getAccessToken = async () => 
{
  // Log an error message if any of the secret values needed for this app are missing
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET)  
  {
    console.error("ERROR: Missing one or more critical Spotify environment variables. Check .env file");
  }
  
  // Spotify requires a base64 encoded token made of the Client ID and Client Secret joined with ":"
  const encodedToken = Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
  
  // Spotify auth API requires data to be sent as Content-Type x-www-form-urlencoded, so data must be converted to query string format 
  const data = qs.stringify
  (
    {
      grant_type: "client_credentials"
    }
  )
  
  const authOptions = 
  { 
    method: "post",
    url: SPOTIFY_ACCESS_TOKEN_URL,
    headers: {
                'Authorization': `Basic ${encodedToken}`,
                'Content-Type': "application/x-www-form-urlencoded"
             },
    data
  };
  
  // Make a post request with axios to Spotify to get access token with client credentials
  return axios(authOptions).then(res => res.data.access_token)
}

// uses Spotify's Search API to get artistId1 by artist_name_1
const artistId1 = async (http, { artist_1 }) => 
{
  const config = 
  {
    method: 'get',
    url: `${BASE_URL}/search?q=${artist_1}&type=artist`
  };
  
  return http(config).then((res) => res.data);
};

// uses Spotify's Search API to get artistId12 by artist_name_2
const artistId2 = async (http, { artist_2 }) => 
{
  const config = 
  {
    method: 'get',
    url: `${BASE_URL}/search?q=${artist_2}&type=artist`
  };
  
  return http(config).then((res) => res.data);
};

// uses Spotify's Search API to get artistId3 by artist_name_3
const artistId3 = async (http, { artist_3 }) => 
{
  const config = 
  {
    method: 'get',
    url: `${BASE_URL}/search?q=${artist_3}&type=artist`
  };
  
  return http(config).then((res) => res.data);
};

// uses Spotify's Browse API to get song recommendations
const getRecommendations = async (http, { artistIds }) => 
{  
  const config = 
  {
    method: 'get',
    url: `${BASE_URL}/recommendations?seed_artists=${artistIds[0]},${artistIds[1]},${artistIds[2]}`
  };

  return http(config).then((res) => res.data);
};

app.post
("/recommendations", async (req, res) => 
 {
    if(!req.body) 
    {
      return res.status(400).send({ message: "Bad Request - must send a JSON body with track and artist" })
    }

    const { artist_1, artist_2, artist_3 } = req.body

    if(!artist_1 || !artist_2 || !artist_3) 
    {
      return res.status(400).send({ message: "Bad Request - must pass all the artists" })
    }

    // Step 1 => Get access token
    let accessToken
    try 
    {
      accessToken = await getAccessToken()
    } 
    catch(err) 
    {
      console.error(err.message)
      return res.status(500).send({ message: "Something went wrong when fetching access token" })
    }
    const http = axios.create({ headers: { 'Authorization': `Bearer ${accessToken}` }})     // Create an instance of axios to apply access token to all request headers

    // Step 2 => get all the respective artist's ids
    let artistIds = []; // creating an array to store all artist ids
    try 
    {
      const result1 = await artistId1(http, { artist_1 })
      console.log(result1);
      artistIds[0] = result1.artists.items[0].id
    } 
    catch(err) 
    {
      console.error(err.message)
      return res.status(500).send({ message: "Error when searching artist_id_1" })
    }  
    try 
    {
      const result = await artistId2(http, { artist_2 })
      artistIds[1] = result.artists.items[0].id
    } 
    catch(err) 
    {
      console.error(err.message)
      return res.status(500).send({ message: "Error when searching artist_id_2" })
    }
    try 
    {
      const result = await artistId3(http, { artist_3 })
      artistIds[2] = result.artists.items[0].id
    } 
    catch(err) 
    {
      console.error(err.message)
      return res.status(500).send({ message: "Error when searching artist_id_3" })
    }  

    // Step 3 => get song recommendations
    try 
    {
      const result = await getRecommendations(http, { artistIds })
      const {tracks} = result

      // if no songs returned in search, send a 404 response
      if(!tracks || !tracks.length ) 
      {
        return res.status(404).send({ message: "No recommendations found." })
      }

      // Success! Send track recommendations back to client
      return res.status(200).send({tracks })
    } 
    catch(err) 
    {
      console.error(err.message)
      return res.status(500).send({ message: "Something went wrong when fetching recommendations" })
    }
 }
);

// after our app has been set up above, start listening on a port provided by Glitch
app.listen
(
  process.env.PORT, () => 
  {
    console.log(`Example app listening at port ${process.env.PORT}`);
  }
);