<template>
	<div id="attachments">
		<input ref="localAttachments"
			type="file"
			multiple
			style="display:none"
			@change="onLocalAttachmentSelected">
		<div v-if="attachments.length > 0">
			<ul>
				<ListItem v-for="attachment in attachments"
					:key="attachment.value"
					:force-display-actions="true"
					:title="attachment.fileName">
					<template #icon>
						<Paperclip :size="24" />
					</template>
					<template #subtitle>
						{{ attachment.formatType }}
					</template>
					<template #actions>
						<ActionLink :href="attachment.value" target="_blank">
							<template #icon>
								<Download :size="20" />
							</template>
							{{ t('calendar', 'View file') }}
						</ActionLink>
						<ActionButton @click="deleteAttachmentFromEvent(attachment)">
							<template #icon>
								<TrashCan :size="20" />
							</template>
							{{ t('calendar', 'Delete file') }}
						</ActionButton>
					</template>
				</ListItem>
			</ul>
			<div class="actions-absolute">
				<Actions>
					<ActionButton 
						@click="openFilesModal()">
						<template #icon>
							<Folder :size="20" />
						</template>
						{{ t('calendar', 'Choose') }}
					</ActionButton>
					<ActionButton @click="clickOnUploadButton">
						<template #icon>
							<Download :size="20" />
						</template>
						{{ t('calendar', 'Upload') }}
					</ActionButton>
				</Actions>
			</div>
		</div>

		<EmptyContent v-else>
			<CloudDownloadOutline :size="80" />
			<template #desc>
				<p>{{ t('calendar', 'This event has no attachments.') }}</p>
				<div class="button-group">
					<Button 
						@click="openFilesModal()" 
						type="primary">
						<template #icon>
							<Folder :size="20" />
						</template>
						{{ t('calendar', 'Choose') }}
					</Button>
					<Button 
						@click="clickOnUploadButton">
						<template #icon>
							<Download :size="20" />
						</template>
						{{ t('calendar', 'Upload') }}
					</Button>
				</div>
			</template>
		</EmptyContent>
	</div>
</template>

<script>
import ListItem from '@nextcloud/vue/dist/Components/ListItem'
import Actions from '@nextcloud/vue/dist/Components/Actions'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionLink from '@nextcloud/vue/dist/Components/ActionLink'
import Button from '@nextcloud/vue/dist/Components/Button'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'

import Paperclip from 'vue-material-design-icons/Paperclip'
import Download from 'vue-material-design-icons/Download'
import TrashCan from 'vue-material-design-icons/TrashCan'
import CloudDownloadOutline from 'vue-material-design-icons/CloudDownloadOutline'
import Folder from 'vue-material-design-icons/Folder'

import { getFilePickerBuilder } from '@nextcloud/dialogs'
import { getRequestToken } from '@nextcloud/auth'
import { shareFile, shareWith, uploadLocalAttachment } from './../../../services/attachmentService'

export default {
	name: 'AttachmentsList',
	components: {
		ListItem,
		Actions,
		ActionButton,
		ActionLink,
		Button,
		EmptyContent,
		Paperclip,
		Download,
		TrashCan,
		Folder,
		CloudDownloadOutline,
		
	},
	props: {
		calendarObjectInstance: {
			type: Object,
			required: true,
		},
		isReadOnly: {
			type: Boolean,
			default: true,
		},
	},
	data(){
		
		return {
			uploading: false,
		}
	},
	computed: {
		attachments(){
			return this.calendarObjectInstance.attachments
		}
	},
	methods: {
		addAttachmentBySharedData(calendarObjectInstance, sharedData){
			this.$store.commit('addAttachmentBySharedData', {
				calendarObjectInstance: calendarObjectInstance,
				sharedData: sharedData,
			})
		},

		addAttachmentByLocalFile(calendarObjectInstance, file){
			console.log('input change')
			this.$store.commit('addAttachmentByLocalFile', {
				calendarObjectInstance: calendarObjectInstance,
				file: file,
			})
		},

		deleteAttachmentFromEvent(attachment) {
			console.log('deleteAttachmentFromEvent',attachment)
			this.$store.commit('deleteAttachment', {
				calendarObjectInstance: this.calendarObjectInstance,
				attachment: attachment,
			})
		},

		async openFilesModal(){
			const picker = getFilePickerBuilder(t('mail', 'Choose a file to add as attachment')).setMultiSelect(false).build()
			try{
				const path = await picker.pick(t('mail', 'Choose a file to share as a link'))
				const sharedData = await shareFile(path, getRequestToken())
				this.addAttachmentBySharedData(this.calendarObjectInstance, sharedData)
			}
			catch(error){

			}
		},

		clickOnUploadButton(){
			this.$refs.localAttachments.click()
		},

		async onLocalAttachmentSelected(e) {
			//const toUpload = sumBy(prop('size'), Object.values(e.target.files))
			const attachments = await uploadLocalAttachment(e, this.$store.getters.getCurrentUserPrincipal.dav, this.attachments).then(
				attachments => {
					attachments.forEach(async attachment => {
						console.log(attachment)
						this.addAttachmentByLocalFile(this.calendarObjectInstance, attachment)
						//const sharedData = await shareFile(attachment.path, getRequestToken())
						
					})
				}
			)
			e.target.value = ''
			
			
		}
	},
}
</script>

<style lang="scss" scoped>

.actions-absolute {
	position: sticky;
	left: 0;
	bottom: 55px;
	right: 0;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
}

#attachments .empty-content {
	margin-top: 1rem;
	text-align: center;
}
.button-group {
	display: flex;
	align-content: center;
	justify-content: center;

	button:first-child {
		margin-right: 6px;
	}
}
</style>
