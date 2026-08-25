import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileText, User, Briefcase } from 'lucide-react'
import Input from '../../components/forms/Input'
import Textarea from '../../components/forms/Textarea'
import DatePicker from '../../components/forms/DatePicker'
import FileUpload from '../../components/forms/FileUpload'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { getMyProfile, updateMyProfile, uploadMyProfilePhoto } from '../../services/freelancerService'

const STATUS_VARIANTS = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
  QUALIFIED: 'info',
  CERTIFIED: 'success',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  INACTIVE: 'default',
}

function toFormValues(profile) {
  return {
    fullName: profile.full_name ?? '',
    mobile: profile.mobile ?? '',
    location: profile.location ?? '',
    dateOfBirth: profile.date_of_birth ?? '',
    currentOccupation: profile.current_occupation ?? '',
    totalExperienceYears: profile.total_experience_years ?? '',
    digitalMarketingExperience: profile.digital_marketing_experience ?? '',
    salesExperience: profile.sales_experience ?? '',
    skills: profile.skills ?? '',
    specializations: profile.specializations ?? '',
    preferredWorkingAreas: profile.preferred_working_areas ?? '',
    previousAgencyExperience: profile.previous_agency_experience ?? '',
    bio: profile.bio ?? '',
    preferredCommunication: profile.preferred_communication ?? '',
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm()

  const loadProfile = async () => {
    setStatus('loading')
    try {
      const data = await getMyProfile()
      setProfile(data)
      reset(toFormValues(data))
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (formValues) => {
    try {
      const updated = await updateMyProfile(formValues)
      setProfile(updated)
      reset(toFormValues(updated))
      toast.success('Profile updated successfully')
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handlePhotoChange = async (file) => {
    if (!file) return
    try {
      const updated = await uploadMyProfilePhoto(file)
      setProfile(updated)
      toast.success('Profile photo updated')
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading profile..." />
  if (status === 'error') return <ErrorState title="Unable to load your profile" onRetry={loadProfile} />

  return (
    <div className="flex flex-col gap-6">
      {/* Header: identity, status, photo */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} size={64} />
          <div>
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">{profile.full_name}</h1>
            <p className="text-sm text-text-secondary">Partner ID: {profile.partner_id ?? 'Pending'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANTS[profile.status] ?? 'default'}>{profile.status}</Badge>
              <Link to="/freelancer/documents" className="flex items-center gap-1 text-sm text-primary hover:underline">
                <FileText className="h-3.5 w-3.5" strokeWidth={2} /> Manage documents
              </Link>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <FileUpload label="Update Profile Photo" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
        </div>
      </Card>

      {profile.status === 'REJECTED' && profile.rejection_reason && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">Reason: {profile.rejection_reason}</p>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <User className="h-4 w-4 text-primary" strokeWidth={2} /> Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="fullName" label="Full Name" {...register('fullName', { required: true })} />
              <Input id="mobile" label="Mobile" {...register('mobile', { required: true })} />
              <Input id="location" label="Location" {...register('location')} />
              <DatePicker id="dateOfBirth" label="Date of Birth" {...register('dateOfBirth')} />
              <Input id="preferredCommunication" label="Preferred Communication (e.g. WhatsApp, Email)" {...register('preferredCommunication')} />
              <Textarea id="bio" label="Bio" className="sm:col-span-2" {...register('bio')} />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Briefcase className="h-4 w-4 text-primary" strokeWidth={2} /> Professional Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="currentOccupation" label="Current Occupation" {...register('currentOccupation')} />
              <Input
                id="totalExperienceYears"
                label="Total Experience (years)"
                type="number"
                step="0.5"
                {...register('totalExperienceYears')}
              />
              <Textarea
                id="digitalMarketingExperience"
                label="Digital Marketing Experience"
                className="sm:col-span-2"
                {...register('digitalMarketingExperience')}
              />
              <Textarea
                id="salesExperience"
                label="Sales Experience"
                className="sm:col-span-2"
                {...register('salesExperience')}
              />
              <Textarea id="skills" label="Skills" className="sm:col-span-2" {...register('skills')} />
              <Textarea
                id="specializations"
                label="Specializations"
                className="sm:col-span-2"
                {...register('specializations')}
              />
              <Textarea
                id="preferredWorkingAreas"
                label="Preferred Working Areas"
                className="sm:col-span-2"
                {...register('preferredWorkingAreas')}
              />
              <Textarea
                id="previousAgencyExperience"
                label="Previous Agency Experience"
                className="sm:col-span-2"
                {...register('previousAgencyExperience')}
              />
            </div>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-fit">
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  )
}
