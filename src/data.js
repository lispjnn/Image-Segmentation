import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export function data() {
  const [userId, setUserId] = useState('');
  const [media, setMedia] = useState([]);

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user !== null ? user.id : '');
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  async function uploadImage(file) {
    const currentDate = new Date().toISOString();
    const fileId = uuidv4();
    const fileName = `${currentDate}_${fileId}_${file.name}`;

    try {
      const { data, error } = await supabase.storage
        .from('images')
        .upload(userId + "/" + fileName, file);
      if (data) {
        getMedia();
      } else {
        console.error('Error uploading image:', error);
      }
    } catch (error) {
      console.error('Error uploading image:', error.message);
    }
  }

  async function getMedia() {
    try {
      const { data, error } = await supabase.storage.from('images').list(userId + '/', {
        limit: 1,
        offset: 0,
        sortBy: {
          column: 'name',
          order: 'desc'
        }
      });
      if (data) {
        setMedia(data);
      } else {
        console.error('Error fetching media:', error);
      }
    } catch (error) {
      console.error('Error fetching media:', error.message);
    }
  }

  return { userId, media, getUser, uploadImage, getMedia };
}