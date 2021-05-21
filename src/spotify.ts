import SpotifyApi from 'spotify-web-api-node'

export default class Spotify {
    client = new SpotifyApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    })

    async authorize() {
        try{
            const response = await this.client.clientCredentialsGrant()
            console.log(response);
            this.client.setAccessToken(response.body.access_token);
        }catch(err){
            console.log(err, "authorize")
        }
    }

    async getPlaylist(id: string) {
        console.log(id,'soy id');
        try{
            const result = await this.client.getPlaylistTracks(id);
            return result.body.items.map(({ track }) => track);
        }catch(err){
            console.log(err);
        }
    }
}
