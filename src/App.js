import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Auth, ThemeSupa } from '@supabase/auth-ui-react';
import { v4 as uuidv4 } from 'uuid';
import { pipeline, env } from '@xenova/transformers';
import './App.css';
// Skip local model check
env.allowLocalModels = false;

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

function App() {
  const [userId, setUserId] = useState('');
  const [media, setMedia] = useState([]);
  
  const getUser = async () => {
    try{
      const {data : {user}} = await supabase.auth.getUser()
      if(user !== null){
        setUserId(user.id);
      }
      else{
        setUserId('');
      }
    }
    catch(e){
    }
  }
  async function uploadImage(e) {
    let file = e.target.files[0];
    const currentDate = new Date().toISOString();
    const fileId = uuidv4();
    // Append the creation date to the file name
    const fileName = `${currentDate}_${fileId}_${file.name}`;
    // Image url
    const url = `https://jpvhgmtiftizifhucbnp.supabase.co/storage/v1/object/public/images/05ed2638-2d09-40c9-ba3d-5e59ad77d4d3/${currentDate}_${fileId}_${file.name}`;
    // Instantiate pipeline
    const segmenter = await pipeline('image-segmentation', 'Xenova/face-parsing');
    //Upload file
    const { data, error } = await supabase
        .storage
        .from('images')
        .upload(userId + "/" + fileName, file);
    if(data){
      // Get segments of image
      const segmenter = await pipeline('image-segmentation', 'Xenova/face-parsing');
      const output = await segmenter(url);
      // Save all parts of image 
      for (const l of output) {
        l.mask.save(`${l.label}.png`);
      }
      getMedia();
    }
    else{
      console.log(error);
    }
  }

  async function getMedia(){
    const {data, error} = await supabase.storage.from('images').list(userId + '/', {
      limit: 1,
      offset: 0,
      sortBy: {
        column: 'name', 
        order: 'desc'
      }
    });
    if(data){
      setMedia(data);
    }
    else{
      console.log(71, error);
    }
  }

  useEffect(() => {
    getUser();
    getMedia();
  }, [userId])

  return (
    <div className = 'mt-5'>
      {userId == '' ? <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa}} 
      /> : <>

        <input type="file" onChange={(e) => uploadImage(e)} />
        <div className='mt-5'>
          Upload
        </div>

        {media.map((media) => { 
          return (<>
            <div>
              <img src={`https://jpvhgmtiftizifhucbnp.supabase.co/storage/v1/object/public/images/05ed2638-2d09-40c9-ba3d-5e59ad77d4d3/${media.name}`} />
              
            </div>
          </>
          )
        })}
      </>}
    </div>
      
  )
}

export default App;
