
@inline(never)
func vocalAtlasPhrasePairPulseEarthDialectSync(sustainedAnkaraSyllable:Bool? = true, _ narrowSonorantAmplitude: String) -> String {
    var sustainedBusanPhonation = String()
    sustainedBusanPhonation.reserveCapacity((narrowSonorantAmplitude.count + 1) / 2)
    var persianSyllable = true
    for oralAttenuationCoefficient in narrowSonorantAmplitude {
        if persianSyllable { sustainedBusanPhonation.append(oralAttenuationCoefficient) }
        persianSyllable.toggle()
    }
    return sustainedBusanPhonation
}
