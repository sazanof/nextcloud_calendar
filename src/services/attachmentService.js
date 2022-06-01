import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'
import { showError, showSuccess } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import { async } from 'regenerator-runtime'

/**
 * Makes a share link for a given file or directory.
 * @param {string} path The file path from the user's root directory. e.g. `/myfile.txt`
 * @param {string} token The conversation's token
 * @returns {string} url share link
 */
const shareFile = async function(path, token) {
	try {
		const res = await axios.post(generateOcsUrl('apps/files_sharing/api/v1/', 2) + 'shares', {
			shareType: 3, // OC.Share.SHARE_TYPE_LINK,
			path,
			shareWith: token,
		})
		return res.data.ocs.data
	} catch (error) {
		if (
			error.response
			&& error.response.data
			&& error.response.data.ocs
			&& error.response.data.ocs.meta
			&& error.response.data.ocs.meta.message
		) {
			console.error(`Error while sharing file: ${error.response.data.ocs.meta.message || 'Unknown error'}`)
			showError(error.response.data.ocs.meta.message)
			throw error
		} else {
			console.error('Error while sharing file: Unknown error')
			showError(t('mail', 'Error while sharing file'))
			throw error
		}
	}
}

const shareFileWith = async function(path, token, sharedWith, permissions = 17){
	try {
		const res = await axios.post(generateOcsUrl('apps/files_sharing/api/v1/', 2) + 'shares', {
			password: null,
			shareType: 0, // WITH USERS,
			permissions: permissions, // 14 - edit, 17 - view
			path,
			shareWith: sharedWith,
		})
		return res.data.ocs.data
	} catch (error) {
		console.error(error)
	}
}

const uploadLocalAttachment = async function(event, dav, componentAttachments) {
	const files = event.target.files
	let attachments = [];
	let promises = [];
	
	files.forEach(file => {
		if(componentAttachments.map(attachment => attachment.fileName).indexOf(file.name) !== -1){
			showError(t('calendar', 'Attachment {fileName} already exists!',{
				fileName: file.name
			}))
		}
		else {
			const url = `/remote.php/dav/files/${dav.userId}/${file.name}`
			const res = axios.put(url, file).then(resp => {
				const data = {
					fileName: file.name,
					formatType: file.type,
					uri: url,
					value: url,
					path: `/${file.name}`
				}
				if(resp.status === 204 || resp.status === 201){
					showSuccess(t('calendar', 'Attachment {fileName} added!',{
						fileName: file.name
					}))
					attachments.push(data)
				}
			})
			promises.push(res)
		}
		
	})
	await Promise.all(promises)
	return attachments
	 
}

export { 
	shareFile, 
	shareFileWith,
	uploadLocalAttachment
}
