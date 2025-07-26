import demoTr from "./demo-tr"

const tr = {
  common: {
    ok: "Tamam!",
    cancel: "İptal",
    back: "Geri",
    logOut: "Çıkış Yap",
    map: "Harita",
    events: "Etkinlikler",
    profile: "Profil",
    venues: "Mekanlar",
    other: "Diğer",
    notSet: "Ayarlanmamış",
    yes: "Evet",
    no: "Hayır",
    chooseOption: "Bir seçenek seçin",
  },
  welcomeScreen: {
    postscript:
      "psst — Bu muhtemelen uygulamanızın görünümü değil. (Tasarımcınız size bu ekranları verdiyse, o zaman gönder!)",
    readyForLaunch: "Uygulamanız, neredeyse yayına hazır!",
    exciting: "(ohh, bu heyecan verici!)",
    letsGo: "Hadi başlayalım!",
  },
  errorScreen: {
    title: "Bir şeyler ters gitti!",
    friendlySubtitle:
      "Bu, bir hata oluştuğunda kullanıcılarınızın üretimde göreceği ekrandır. Bu mesajı (`app/i18n/tr.ts` konumunda) ve muhtemelen düzeni de (`app/screens/ErrorScreen`) özelleştirmek isteyeceksiniz. Bunu tamamen kaldırmak istiyorsanız, <ErrorBoundary> bileşeni için `app/app.tsx` dosyasını kontrol edin.",
    reset: "UYGULAMAYI SIFIRLA",
    traceTitle: "%{name} yığınından hata",
  },
  emptyStateComponent: {
    generic: {
      heading: "Çok boş... çok üzücü",
      content:
        "Henüz veri bulunamadı. Yenilemek veya uygulamayı yeniden yüklemek için butona tıklamayı deneyin.",
      button: "Tekrar deneyelim",
    },
  },

  errors: {
    invalidEmail: "Geçersiz e-posta adresi.",
    emailRequired: "E-posta gereklidir",
    passwordRequired: "Şifre gereklidir",
    passwordMinLength: "Şifre en az 6 karakter uzunluğunda olmalıdır",
    confirmPasswordRequired: "Şifre onayı gereklidir",
    passwordMismatch: "Şifreler eşleşmiyor",
    invalidCredentials: "Geçersiz e-posta veya şifre",
    emailNotConfirmed: "Lütfen e-posta adresinizi doğrulayın",
    tooManyRequests: "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin",
    networkError: "Ağ bağlantı hatası. Lütfen internet bağlantınızı kontrol edin",
    serviceUnavailable: "Servis geçici olarak kullanılamıyor. Lütfen tekrar deneyin",
    unknownError: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin",
    // Profil doğrulama hataları
    displayNameRequired: "Görünen ad gereklidir",
    displayNameTooShort: "Görünen ad en az 2 karakter uzunluğunda olmalıdır",
    displayNameTooLong: "Görünen ad 50 karakterden fazla olamaz",
    displayNameInvalidCharacters:
      "Görünen ad yalnızca harf, rakam, boşluk, tire, alt çizgi ve nokta içerebilir",
    bioTooLong: "Biyografi 500 karakterden fazla olamaz",
    // Profil işlem hataları
    profileNotFound: "Profil bulunamadı",
    updateProfileFailed: "Profil güncellenemedi",
    uploadAvatarFailed: "Profil fotoğrafı yüklenemedi",
    deleteAvatarFailed: "Profil fotoğrafı silinemedi",
    fetchProfileFailed: "Profil yüklenemedi",
    // Dosya yükleme hataları
    invalidFileType: "Geçersiz dosya tipi. Lütfen JPEG, PNG, GIF veya WebP kullanın",
    fileTooLarge: "Dosya boyutu izin verilen maksimum limiti aşıyor",
    storageError: "Depolama işlemi başarısız oldu",
    uploadFailed: "Dosya yükleme başarısız oldu",
  },
  loginScreen: {
    logIn: "Giriş Yap",
    enterDetails:
      "Çok gizli bilgilerin kilidini açmak için aşağıya bilgilerinizi girin. Ne beklediğimizi asla tahmin edemeyeceksiniz. Ya da edebilirsiniz; burada roket bilimi yok.",
    emailFieldLabel: "E-posta",
    passwordFieldLabel: "Şifre",
    emailFieldPlaceholder: "E-posta adresinizi girin",
    passwordFieldPlaceholder: "Süper gizli şifre buraya",
    tapToLogIn: "Giriş yapmak için dokunun!",
    signingIn: "Giriş yapılıyor...",
    hint: "İpucu: herhangi bir e-posta adresi ve favori şifrenizi kullanabilirsiniz :)",
    dontHaveAccount: "Hesabınız yok mu? Kayıt Ol",
  },
  demoNavigator: {
    componentsTab: "Bileşenler",
    debugTab: "Hata Ayıklama",
    communityTab: "Topluluk",
    podcastListTab: "Podcast",
  },
  demoCommunityScreen: {
    title: "Toplulukla bağlantı kurun",
    tagLine:
      "Infinite Red'in React Native mühendisleri topluluğuna bağlanın ve bizimle uygulama geliştirmenizi bir üst seviyeye taşıyın!",
    joinUsOnSlackTitle: "Slack'te bize katılın",
    joinUsOnSlack:
      "Dünyanın her yerinden React Native mühendisleriyle bağlantı kurabilecek bir yer olmasını diler misiniz? Infinite Red Community Slack'teki konuşmaya katılın! Büyüyen topluluğumuz soru sormanız, başkalarından öğrenmeniz ve ağınızı büyütmeniz için güvenli bir alan.",
    joinSlackLink: "Slack Topluluğuna Katıl",
    makeIgniteEvenBetterTitle: "Ignite'ı daha da iyi hale getir",
    makeIgniteEvenBetter:
      "Ignite'ı daha da iyi hale getirmek için bir fikriniz var mı? Bunu duymaktan mutluluk duyarız! En iyi React Native araçlarını oluşturmamıza yardım etmek isteyen başkalarını her zaman arıyoruz. Ignite'ın geleceğini inşa etmede bize katılmak için GitHub'da bize katılın.",
    contributeToIgniteLink: "Ignite'a Katkıda Bulun",
    theLatestInReactNativeTitle: "React Native'deki en son gelişmeler",
    theLatestInReactNative: "React Native'in sunduğu her şeyde sizi güncel tutmak için buradayız.",
    reactNativeRadioLink: "React Native Radio",
    reactNativeNewsletterLink: "React Native Newsletter",
    reactNativeLiveLink: "React Native Live",
    chainReactConferenceLink: "Chain React Conference",
    hireUsTitle: "Bir sonraki projeniz için Infinite Red'i işe alın",
    hireUs:
      "Tam bir proje yürütmek veya ekipleri uygulamalı eğitimimizle hızlandırmak olsun, Infinite Red hemen hemen her React Native projesiyle yardım edebilir.",
    hireUsLink: "Bize mesaj gönderin",
  },
  demoShowroomScreen: {
    jumpStart: "Projenizi hızlandıracak bileşenler!",
    lorem2Sentences:
      "Nulla cupidatat deserunt amet quis aliquip nostrud do adipisicing. Adipisicing excepteur elit laborum Lorem adipisicing do duis.",
    demoHeaderTxExample: "Yaşasın",
    demoViaTxProp: "`tx` Prop'u İle",
    demoViaSpecifiedTxProp: "`{{prop}}Tx` Prop'u İle",
  },
  demoDebugScreen: {
    howTo: "NASIL YAPILIR",
    title: "Hata Ayıklama",
    tagLine:
      "Tebrikler, burada çok gelişmiş bir React Native uygulama şablonunuz var. Bu şablonun avantajını kullanın!",
    reactotron: "Reactotron'a Gönder",
    reportBugs: "Hataları Bildir",
    demoList: "Demo Liste",
    demoPodcastList: "Demo Podcast Listesi",
    androidReactotronHint:
      "Bu işe yaramazsa, Reactotron masaüstü uygulamasının çalıştığından emin olun, terminalinizden adb reverse tcp:9090 tcp:9090 komutunu çalıştırın ve uygulamayı yeniden yükleyin.",
    iosReactotronHint:
      "Bu işe yaramazsa, Reactotron masaüstü uygulamasının çalıştığından emin olun ve uygulamayı yeniden yükleyin.",
    macosReactotronHint:
      "Bu işe yaramazsa, Reactotron masaüstü uygulamasının çalıştığından emin olun ve uygulamayı yeniden yükleyin.",
    webReactotronHint:
      "Bu işe yaramazsa, Reactotron masaüstü uygulamasının çalıştığından emin olun ve uygulamayı yeniden yükleyin.",
    windowsReactotronHint:
      "Bu işe yaramazsa, Reactotron masaüstü uygulamasının çalıştığından emin olun ve uygulamayı yeniden yükleyin.",
  },
  demoPodcastListScreen: {
    title: "React Native Radio bölümleri",
    onlyFavorites: "Sadece Favorileri Göster",
    favoriteButton: "Favori",
    unfavoriteButton: "Favoriden Çıkar",
    accessibility: {
      cardHint:
        "Bölümü dinlemek için çift dokunun. Bu bölümü {{action}} için çift dokunun ve basılı tutun.",
      switch: "Sadece favorileri göstermek için açın",
      favoriteAction: "Favoriyi Değiştir",
      favoriteIcon: "Bölüm favorilere eklenmedi",
      unfavoriteIcon: "Bölüm favorilere eklendi",
      publishLabel: "{{date}} tarihinde yayınlandı",
      durationLabel: "Süre: {{hours}} saat {{minutes}} dakika {{seconds}} saniye",
    },
    noFavoritesEmptyState: {
      heading: "Bu biraz boş görünüyor",
      content: "Henüz favori eklenmedi. Favorilerinize eklemek için bir bölümün kalbine dokunun!",
    },
  },
  signUpScreen: {
    signUp: "Kayıt Ol",
    createAccount: "Başlamak için yeni bir hesap oluşturun",
    emailFieldLabel: "E-posta",
    emailFieldPlaceholder: "E-posta adresinizi girin",
    passwordFieldLabel: "Şifre",
    passwordFieldPlaceholder: "Bir şifre oluşturun",
    confirmPasswordFieldLabel: "Şifreyi Onayla",
    confirmPasswordFieldPlaceholder: "Şifrenizi tekrar girin",
    businessAccount: "İşletme hesabı oluşturuyorum",
    createAccountButton: "Hesap Oluştur",
    signingUp: "Hesap Oluşturuluyor...",
    alreadyHaveAccount: "Zaten hesabınız var mı? Giriş Yap",
    emailVerificationRequired: "Hesabınızı doğrulamak için lütfen e-postanızı kontrol edin",
  },
  userNavigator: {
    moderate: "Modere Et",
  },
  profile: {
    userProfile: "Kullanıcı Profili",
    profileInformation: "Profil Bilgileri",
    accountActions: "Hesap İşlemleri",
    noProfileData: "Profil bilgisi mevcut değil",
    refresh: "Yenile",
    loadingProfile: "Profil yükleniyor...",
    errorMessage: "Hata: {{error}}",
    displayName: "Görünen Ad",
    bio: "Biyografi",
    noBio: "Biyografi eklenmemiş",
    location: "Konum (Şehir)",
    selectCity: "Bir şehir seçin",
    nameField: "Ad: {{name}}",
    bioField: "Biyografi: {{bio}}",
    locationField: "Konum: {{location}}",
    profileCompleteField: "Profil Tamamlandı: {{status}}",
    editProfile: "Profili Düzenle",
    cancel: "İptal",
    saveChanges: "Değişiklikleri Kaydet",
    success: "Başarılı",
    error: "Hata",
    profileUpdatedSuccessfully: "Profil başarıyla güncellendi!",
    failedToUpdateProfile: "Profil güncellenemedi",
    unexpectedError: "Beklenmeyen bir hata oluştu",
    uploadAvatar: "Profil Fotoğrafı Yükle",
    uploadAvatarMessage: "Profil fotoğrafınız için bir resim seçin",
    selectPhoto: "Fotoğraf Seç",
    avatarUploadReady: "Profil fotoğrafı yükleme özelliği hazır!",
    avatarUploadFailed: "Profil fotoğrafı yüklenemedi",
    avatarUploadedSuccessfully: "Profil fotoğrafı başarıyla yüklendi!",
    permissionRequired: "İzin Gerekli",
    photoLibraryPermissionMessage:
      "Profil fotoğrafı yüklemek için fotoğraf galerinize erişim iznine ihtiyacımız var",
    imageSelected: "Resim başarıyla seçildi",
    uploading: "Yükleniyor...",
    profileComplete: "Profil Tamamlandı",
    profileIncomplete: "Profil Tamamlanmadı",
    allInformationProvided: "Tüm gerekli bilgiler sağlandı",
    profileCompletionDescription:
      "%{{percentage}} tamamlandı - Profilinizi geliştirmek için daha fazla detay ekleyin",
    appearance: "Görünüm",
    darkMode: "Karanlık Mod",
    lightMode: "Aydınlık Mod",
    systemTheme: "Sistem Teması",
    themeSettings: "Tema Ayarları",
    // Business Profile specific keys
    businessInformation: "İşletme Bilgileri",
    contactInformation: "İletişim Bilgileri",
    businessName: "İşletme Adı",
    businessTypes: "İşletme Türleri",
    phone: "Telefon Numarası",
    websiteUrl: "Web Sitesi",
    description: "Açıklama",
    noDescription: "Açıklama eklenmemiş",
  },

  businessTypes: {
    restaurant: "Restoran",
    bar: "Bar",
    cafe: "Kafe", 
    eventOrganizer: "Etkinlik Organizatörü",
    other: "Diğer",
  },

  ...demoTr,
}

export default tr
export type TurkishTranslations = typeof tr
