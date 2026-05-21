import db from './database';
import { showToast } from './ui_utils';

let profilePhotoData = null;

export async function renderProfile() {
    const profile = await db.profile.get('coach_profile');
    if (profile) {
        const nameInput = document.getElementById('profileName');
        if (nameInput) {
            nameInput.value = profile.name || '';
            document.getElementById('profileClub').value = profile.club || '';
            document.getElementById('profileExperience').value = profile.experience || '';
            document.getElementById('profileSpecialty').value = profile.specialty || '';

            if (profile.photo) {
                profilePhotoData = profile.photo;
                const preview = document.getElementById('profilePhotoPreview');
                const cardPhoto = document.getElementById('cardPhoto');
                if(preview) preview.innerHTML = `<img src="${profile.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                if(cardPhoto) cardPhoto.innerHTML = `<img src="${profile.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }

            const cardName = document.getElementById('cardName');
            if(cardName) cardName.innerText = profile.name || '-';
            const cardClub = document.getElementById('cardClub');
            if(cardClub) cardClub.innerText = profile.club || '-';
            const cardExp = document.getElementById('cardExp');
            if(cardExp) cardExp.innerText = (profile.experience || '0') + ' Yıl';
            const cardSpec = document.getElementById('cardSpec');
            if(cardSpec) cardSpec.innerText = profile.specialty || '-';
        }

        if (profile.name) {
            const dashWelcome = document.getElementById('dashWelcomeText');
            if (dashWelcome) {
                const firstName = profile.name.split(' ')[0];
                dashWelcome.innerHTML = `Ana Karargah'a Hoş Geldin, Koç ${firstName}! <span>⛹️</span>`;
            }
        }
    }
}

export async function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const club = document.getElementById('profileClub').value.trim();
    const experience = document.getElementById('profileExperience').value;
    const specialty = document.getElementById('profileSpecialty').value.trim();

    const profileData = {
        id: 'coach_profile',
        name,
        club,
        experience,
        specialty,
        photo: profilePhotoData,
        updatedAt: new Date().toISOString()
    };

    await db.profile.put(profileData);
    showToast('Profil başarıyla güncellendi! ✅');
    renderProfile();
}

export function handleProfilePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        profilePhotoData = e.target.result;
        const preview = document.getElementById('profilePhotoPreview');
        if(preview) preview.innerHTML = `<img src="${profilePhotoData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    };
    reader.readAsDataURL(file);
}
