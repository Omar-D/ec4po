// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc, deleteDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration (Replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyDjDU0FuzfekhAyS7QyV6q2vMBQHiNqmNs",
    authDomain: "brain-tube.firebaseapp.com",
    databaseURL: "https://brain-tube-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "brain-tube",
    storageBucket: "brain-tube.appspot.com",
    messagingSenderId: "386770919276",
    appId: "1:386770919276:web:31da802954d4efa6775d49",
    measurementId: "G-88KPGPJV8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// const audioPlayer = document.getElementById("audioPlayer");

const currentPage = window.location.pathname;

// Upload Song with Thumbnail
if (currentPage.includes("upload.html")) {
    const songNameInput = document.getElementById("exampleInputName1");
    const authorInput = document.getElementById("exampleInputAuthor2");
    const fileInput = document.getElementById("fileInput");
    const thumbnailInput = document.getElementById("thumbnailInput");
    const uploadBtn = document.getElementById("uploadBtn");
    uploadBtn.addEventListener("click", async () => {
        const file = fileInput.files[0];
        const thumbnail = thumbnailInput.files[0];
        const songName = songNameInput.value.trim();
        const author = authorInput.value.trim();

        if (!file || !thumbnail || !author) {
            return alert("Please select a song, thumbnail, and enter author name!");
        }

        // Upload song
        const songRef = ref(storage, `songs/${file.name}`);
        const songUpload = uploadBytesResumable(songRef, file);
        const uploadingProgress = document.getElementById("uploading-progress");
        const uploadingProgressText = document.getElementById("uploadingProgressText");

        songUpload.on("state_changed",
            snapshot => {
                const uploadProgress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                uploadingProgressText.innerText = `${uploadProgress}%`;
                uploadingProgress.style = `width: ${uploadProgress}%`;
                uploadingProgress.setAttribute("aria-valuenow", `${uploadProgress}%`);
                // console.log(`Uploading Song: ${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}%`);
            },
            error => console.error("Song Upload Failed", error),
            async () => {
                const songURL = await getDownloadURL(songUpload.snapshot.ref);

                // Upload Thumbnail
                const thumbRef = ref(storage, `thumbnails/${thumbnail.name}`);
                const thumbUpload = await uploadBytesResumable(thumbRef, thumbnail);
                const thumbURL = await getDownloadURL(thumbUpload.ref);

                let uploadDate = new Date();

                // Store metadata in Firestore
                await addDoc(collection(db, "songs"), {
                    name: songName,
                    author: author,
                    songURL: songURL,
                    thumbnailURL: thumbURL,
                    songPath: songRef.fullPath,
                    thumbnailPath: thumbRef.fullPath,
                    uploadDate: uploadDate.toISOString().split('T')[0]
                });

                // alert("Song uploaded successfully!");
                document.location.href = '/Ec4po/';
                // loadSongs();
            }
        );
    });
} else if (currentPage.includes("index.html") || currentPage.includes("/")) {

    const songList = document.getElementById("songList");

    // Load Songs from Firestore
    async function loadSongs() {
        songList.innerHTML = "";
        const querySnapshot = await getDocs(collection(db, "songs"));

        querySnapshot.forEach(doc => {
            const song = doc.data();

            // Create song card
            // const songCard = document.createElement("div");
            // songCard.classList.add("song-card");
            const songCard = document.createElement("tr");
            songCard.setAttribute("id", doc.id);

            //     songCard.innerHTML = `
            //     <img src="${song.thumbnailURL}" alt="${song.name}">
            //     <div style='text-align: start;'>
            //     <h3>${song.name}</h3>
            //     <p>By: ${song.author}</p>
            //     <audio src="${song.songURL} preload="auto" controls>"
            //     </div>
            // `;

            songCard.innerHTML = `
            <td>
                <div class="d-inline-block align-middle">
                    <img src="${song.thumbnailURL}" alt="${song.name}" class="img-40 align-top mr-15 song-img">
                    <div class="d-inline-block">
                        <h6>${song.name}</h6>
                        <p class="text-muted mb-0">${song.author}</p>
                    </div>
                </div>
            </td>
            <!--<td>Pinterest</td>
            <td>223</td>-->
            <td>${song.uploadDate}</td>
            <!--<td>
                <label class="badge badge-primary">Sketch</label>
                <label class="badge badge-primary">Ui</label>
            </td>-->
            <td>
                <!--<a href="#!"><i class="ik ik-edit f-16 mr-15 text-green"></i></a>-->
                <a href="#!" id="${doc.id}-play"><i class="ik ik-play f-16 mr-15 text-green"></i></a>
                <a href="#!" id="${doc.id}-remove"><i class="ik ik-trash-2 f-16 text-red"></i></a>
            </td>`;

            // const songPlayer = document.getElementById("songPlayer");

            // songCard.addEventListener("click", async () => {
            //     songPlayer.src = song.songURL;
            // });

            // songCard.style.width = "100%";

            songList.appendChild(songCard);

            const songPlayer = document.getElementById("songPlayer");
            const songPlayBtn = document.getElementById(`${doc.id}-play`);
            const songRemoveBtn = document.getElementById(`${doc.id}-remove`);

            songPlayBtn.addEventListener("click", async () => {
                songPlayer.src = song.songURL;
            });

            songRemoveBtn.addEventListener("click", async () => {
                deleteSong(doc.id, song.songPath, song.thumbnailPath);
            });

        });
    }

    // Delete song and thumbnail
    async function deleteSong(songId, songPath, thumbnailPath) {
        if (!confirm("Are you sure you want to delete this song?")) {
            return;
        }

        try {
            // Delete from Firestore
            await deleteDoc(doc(db, "songs", songId));

            // Delete song from Storage
            const songRef = ref(storage, songPath);
            await deleteObject(songRef);

            // Delete thumbnail from Storage
            const thumbRef = ref(storage, thumbnailPath);
            await deleteObject(thumbRef);

            // alert("Song deleted successfully!");
            const songCard = document.getElementById(`${songId}`);
            songCard.remove();
        } catch (error) {
            console.error("Error deleting song:", error);
            alert("Failed to delete song.");
        }
    }

    // Load Songs on Start
    loadSongs();
}