// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc, deleteDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const songImage = document.getElementById("songImage");
const thumbnailInput = document.getElementById("thumbnailInput");

thumbnailInput.addEventListener('change', function (e) {
    if (e.target.files[0]) {
        var reader = new FileReader();
        reader.onload = function (event) {
            songImage.setAttribute("src", event.target.result);
            // $("#hide").empty().append(songImage);
        };
        reader.readAsDataURL(e.target.files[0]);
        // document.body.append('You selected ' + e.target.files[0].name);
    }
});

// Upload Song with Thumbnail
if (currentPage.includes("upload.html")) {
    const songNameInput = document.getElementById("exampleInputName1");
    const authorInput = document.getElementById("exampleInputAuthor2");
    const fileInput = document.getElementById("fileInput");
    const thumbnailInput = document.getElementById("thumbnailInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const exampleModalCenter = document.getElementById("exampleModalCenter");
    uploadBtn.addEventListener("click", async () => {
        const file = fileInput.files[0];
        const thumbnail = thumbnailInput.files[0];
        const songName = songNameInput.value.trim();
        const author = authorInput.value.trim();

        let modal = new bootstrap.Modal(exampleModalCenter);
        modal.show();

        if (!file || !thumbnail || !author || !songName) {
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

        querySnapshot.forEach(docResult => {
            const song = docResult.data();

            // Create song card
            // const songCard = document.createElement("div");
            // songCard.classList.add("song-card");
            const songCard = document.createElement("tr");
            songCard.setAttribute("id", docResult.id);

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
                <a href="#!" id="${docResult.id}-play"><i class="ik ik-play f-16 mr-15 text-green"></i></a>
                <a href="#!" id="${docResult.id}-edit" data-toggle="modal" data-target="#exampleModalCenter"><i class="ik ik-edit f-16 mr-15 text-primary"></i></a>
                <a href="#!" id="${docResult.id}-remove"><i class="ik ik-trash-2 f-16 mr-15 text-red"></i></a>
            </td>`;

            // const songPlayer = document.getElementById("songPlayer");

            // songCard.addEventListener("click", async () => {
            //     songPlayer.src = song.songURL;
            // });

            // songCard.style.width = "100%";

            songList.appendChild(songCard);

            const songPlayer = document.getElementById("songPlayer");
            const songPlayBtn = document.getElementById(`${docResult.id}-play`);
            const songEditBtn = document.getElementById(`${docResult.id}-edit`);
            const songRemoveBtn = document.getElementById(`${docResult.id}-remove`);
            const songNameInput = document.getElementById("exampleInputName1");
            const songAuthorInput = document.getElementById("exampleInputAuthor2");
            const thumbnailInput = document.getElementById("thumbnailInput");
            const fileInput = document.getElementById("fileInput");
            const saveChangesBtn = document.getElementById("save-changes");
            const closeModalBtn = document.getElementById("close-modal");
            let modal = new bootstrap.Modal(document.getElementById("exampleModalCenter"));
            // const songImage = document.getElementById("songImage");
            // const thumbnailInput = document.getElementById("thumbnailInput");

            // thumbnailInput.addEventListener('change', function (e) {
            //     if (e.target.files[0]) {
            //         var reader = new FileReader();
            //         reader.onload = function (event) {
            //             songImage.attr("src", event.target.result);
            //             // $("#hide").empty().append(songImage);
            //         };
            //         reader.readAsDataURL(myFile);
            //         document.body.append('You selected ' + e.target.files[0].name);
            //     }
            // });

            songPlayBtn.addEventListener("click", async () => {
                songPlayer.src = song.songURL;
            });

            songEditBtn.addEventListener("click", async () => {
                songNameInput.value = song.name;
                songAuthorInput.value = song.author;
                songImage.setAttribute("src", song.thumbnailURL);

                async function saveChanges() {
                    const newName = songNameInput.value.trim();
                    const newAuthor = songAuthorInput.value.trim();
                    const newThumbnail = thumbnailInput.files[0];
                    const newSong = fileInput.files[0];

                    if (!newName || !newAuthor) {
                        return alert("Please select a song, thumbnail, and enter author name!");
                    }

                    if(newName === song.name && newAuthor === song.author) {
                        return alert("You can't update the music with the same details and informations");
                    }

                    let updatedData = { name: newName, author: newAuthor };

                    if (newThumbnail) {
                        const newThumbRef = ref(storage, `thumbnails/${newThumbnail.name}`);
                        const thumbUpload = await uploadBytesResumable(newThumbRef, newThumbnail);
                        const newThumbURL = await getDownloadURL(thumbUpload.ref);

                        // Delete old thumbnail
                        const oldThumbRef = ref(storage, song.thumbnailPath);
                        await deleteObject(oldThumbRef);

                        updatedData.thumbnailURL = newThumbURL;
                        updatedData.thumbnailPath = newThumbRef.fullPath;
                    }

                    if (newSong) {
                        const newSongRef = ref(storage, `songs/${newSong.name}`);
                        const songUpload = await uploadBytesResumable(newSongRef, newSong);
                        const newSongURL = await getDownloadURL(songUpload.ref);

                        // Delete old thumbnail
                        const oldSongRef = ref(storage, song.songPath);
                        await deleteObject(oldSongRef);

                        updatedData.songURL = newSongURL;
                        updatedData.songPath = newSongRef.fullPath;
                    }

                    await updateDoc(doc(db, "songs", docResult.id), updatedData);

                    closeModalBtn.click();

                    loadSongs();
                }

                // saveChangesBtn.addEventListener("click", async function eventHandler() {
                    

                //     ///this will execute only once
                //     // alert(song.name);
                // });
            });

            songRemoveBtn.addEventListener("click", async () => {
                deleteSong(docResult.id, song.songPath, song.thumbnailPath);
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